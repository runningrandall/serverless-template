import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as verifiedpermissions from 'aws-cdk-lib/aws-verifiedpermissions';

interface AuthStackProps extends cdk.StackProps {
    stageName: string;
}

export class AuthStack extends cdk.Stack {
    public readonly userPool: cognito.UserPool;
    public readonly userPoolClient: cognito.UserPoolClient;
    public readonly policyStoreId: string;

    constructor(scope: Construct, id: string, props: AuthStackProps) {
        super(scope, id, props);

        // 1. Cognito User Pool
        this.userPool = new cognito.UserPool(this, 'UserPool', {
            selfSignUpEnabled: true,
            signInAliases: { email: true },
            autoVerify: { email: true },
            passwordPolicy: {
                minLength: 8,
                requireLowercase: true,
                requireUppercase: true,
                requireDigits: true,
            },
            removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT for production
        });

        // 2. Groups
        const groups = ['Admin', 'Manager', 'User'];
        groups.forEach(groupName => {
            new cognito.CfnUserPoolGroup(this, `Group${groupName}`, {
                userPoolId: this.userPool.userPoolId,
                groupName: groupName,
            });
        });

        // 3. App Client
        this.userPoolClient = this.userPool.addClient('AppClient', {
            userPoolClientName: 'frontend-client',
            authFlows: {
                userSrp: true,
            },
        });

        // 4. Verified Permissions Policy Store
        const policyStore = new verifiedpermissions.CfnPolicyStore(this, 'PolicyStore', {
            validationSettings: {
                mode: 'STRICT',
            },
            schema: {
                cedarJson: JSON.stringify({
                    "Hmaas": {
                        "entityTypes": {
                            "User": {
                                "shape": {
                                    "type": "Record",
                                    "attributes": {
                                        "groups": {
                                            "type": "Set",
                                            "element": {
                                                "type": "String"
                                            }
                                        }
                                    }
                                }
                            },
                            "Action": {},
                            "Resource": {}
                        },
                        "actions": {
                            "ReadDashboard": {
                                "appliesTo": {
                                    "principalTypes": ["User"],
                                    "resourceTypes": ["Resource"]
                                }
                            },
                            "ManageUsers": {
                                "appliesTo": {
                                    "principalTypes": ["User"],
                                    "resourceTypes": ["Resource"]
                                }
                            },
                            "ReadProfile": {
                                "appliesTo": {
                                    "principalTypes": ["User"],
                                    "resourceTypes": ["Resource"]
                                }
                            }
                        }
                    }
                }),
            },
        });

        this.policyStoreId = policyStore.attrPolicyStoreId;

        // 5. Policies
        // Admin: Full Access (Conceptual, simplified)
        new verifiedpermissions.CfnPolicy(this, 'AdminPolicy', {
            policyStoreId: this.policyStoreId,
            definition: {
                static: {
                    description: "Admin has full access",
                    statement: `permit(principal, action, resource) when { principal.groups.contains("Admin") };`
                }
            }
        });

        // Manager: Limited Access
        new verifiedpermissions.CfnPolicy(this, 'ManagerPolicy', {
            policyStoreId: this.policyStoreId,
            definition: {
                static: {
                    description: "Manager can read dashboard and manage users",
                    statement: `permit(principal, action, resource) when { principal.groups.contains("Manager") && [Action::"ReadDashboard", Action::"ManageUsers"].contains(action) };`
                }
            }
        });

        // User: Basic Access
        new verifiedpermissions.CfnPolicy(this, 'UserPolicy', {
            policyStoreId: this.policyStoreId,
            definition: {
                static: {
                    description: "User can read profile",
                    statement: `permit(principal, action, resource) when { principal.groups.contains("User") && action == Action::"ReadProfile" };`
                }
            }
        });


        new cdk.CfnOutput(this, 'UserPoolId', { value: this.userPool.userPoolId });
        new cdk.CfnOutput(this, 'UserPoolClientId', { value: this.userPoolClient.userPoolClientId });
        new cdk.CfnOutput(this, 'PolicyStoreId', { value: this.policyStoreId });
    }
}
