"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const aws_jwt_verify_1 = require("aws-jwt-verify");
const client_verifiedpermissions_1 = require("@aws-sdk/client-verifiedpermissions");
const userPoolId = process.env.USER_POOL_ID;
const clientId = process.env.USER_POOL_CLIENT_ID;
const policyStoreId = process.env.POLICY_STORE_ID;
const verifier = aws_jwt_verify_1.CognitoJwtVerifier.create({
    userPoolId: userPoolId,
    tokenUse: "access",
    clientId: clientId,
});
const avp = new client_verifiedpermissions_1.VerifiedPermissionsClient({});
const handler = async (event) => {
    console.log("Authorizer Event:", JSON.stringify(event));
    try {
        const token = event.authorizationToken.replace("Bearer ", "");
        const payload = await verifier.verify(token);
        const userId = payload.sub;
        const groups = (payload["cognito:groups"] || []);
        // Map Method/Path to Action
        // This is a naive mapping for demonstration.
        // Real world would be more granular or use context.
        // Resource is currently global "Resource" for simplicity in AVP schema.
        let action = "ReadDashboard"; // Default safer read action
        const method = event.methodArn.split(':')[2]; // GET, POST, etc (Wait, methodArn format is arn:aws:execute-api:region:account:apiId/stage/method/path)
        // Actually methodArn is the ARN of the method being called.
        // But we might want to just check generic permissions.
        // Let's infer action from the request context if possible, but Token Authorizer doesn't give path directly in event root
        // The event.methodArn contains it.
        // arn:aws:execute-api:region:account-id:api-id/stage-name/HTTP-VERB/resource-path-specifier
        const arnParts = event.methodArn.split('/');
        const httpMethod = arnParts[2]; // GET, POST
        const resourcePath = arnParts.slice(3).join('/'); // items, items/123
        if (resourcePath.startsWith('items')) {
            if (httpMethod === 'GET') {
                action = "ReadDashboard";
            }
            else {
                action = "ManageUsers"; // Write actions
            }
        }
        // Call AVP
        // Entity ID: using the 'sub' from Cognito
        const command = new client_verifiedpermissions_1.IsAuthorizedCommand({
            policyStoreId,
            principal: {
                entityType: "Test::User",
                entityId: userId,
            },
            action: {
                actionType: "Test::Action",
                actionId: action,
            },
            resource: {
                entityType: "Test::Resource",
                entityId: "default",
            },
            // Pass groups as context or attributes?
            // In the schema, User has 'groups' attribute. 
            // But we can't easily populate the Entity Store in AVP in real-time without sync.
            // Better to pass attributes in the 'context' or 'entities' field of IsAuthorized if using Slice/Context?
            // Wait, standard IsAuthorized checks against the store. 
            // If we didn't put the User in the store, we can use 'IsAuthorizedWithToken' (identity source) OR provide entities in the request.
            // For this template, let's pass the User entity *in the request* (Transient Entity).
            entities: {
                entityList: [
                    {
                        identifier: { entityType: "Test::User", entityId: userId },
                        attributes: {
                            groups: {
                                set: groups.map(g => ({ string: g }))
                            }
                        }
                    }
                ]
            }
        });
        const avpResponse = await avp.send(command);
        console.log("AVP Response:", avpResponse);
        const isAllowed = avpResponse.decision === 'ALLOW';
        return generatePolicy(userId, isAllowed ? 'Allow' : 'Deny', event.methodArn);
    }
    catch (err) {
        console.error("Auth Failed:", err);
        throw new Error("Unauthorized"); // Refuses 401
    }
};
exports.handler = handler;
function generatePolicy(principalId, effect, resource) {
    return {
        principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [{
                Action: 'execute-api:Invoke',
                Effect: effect,
                Resource: resource,
            }],
        },
        context: {
            // Pass info to backend lambda if needed
        }
    };
}
