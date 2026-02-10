import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

import * as iam from 'aws-cdk-lib/aws-iam';
import { AuthStack } from './auth-stack';

interface InfraStackProps extends cdk.StackProps {
  auth: AuthStack;
  stageName: string;
}

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: InfraStackProps) {
    super(scope, id, props);

    // 1. DynamoDB Table
    const table = new dynamodb.Table(this, 'TemplateTable', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT for production
    });

    // 2. API Gateway
    const api = new apigateway.RestApi(this, 'TemplateApi', {
      restApiName: `Template Service ${props.stageName}`,
      description: 'This service serves the template app.',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
      deployOptions: {
        stageName: props.stageName, // Use the stage name for the API Gateway stage too
      },
    });

    // 3. Lambda Functions
    const backendPath = path.join(__dirname, '../../backend/src/handlers');

    const commonProps = {
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      environment: {
        TABLE_NAME: table.tableName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['aws-sdk'], // aws-sdk v3 is included in runtime but good to be explicit for others
      },
    };

    const createItemLambda = new nodejs.NodejsFunction(this, 'createItemLambda', {
      entry: path.join(backendPath, 'createItem.ts'),
      ...commonProps,
    });

    const getItemLambda = new nodejs.NodejsFunction(this, 'getItemLambda', {
      entry: path.join(backendPath, 'getItem.ts'),
      ...commonProps,
    });

    const listItemsLambda = new nodejs.NodejsFunction(this, 'listItemsLambda', {
      entry: path.join(backendPath, 'listItems.ts'),
      ...commonProps,
    });

    const deleteItemLambda = new nodejs.NodejsFunction(this, 'deleteItemLambda', {
      entry: path.join(backendPath, 'deleteItem.ts'),
      ...commonProps,
    });

    // 4. Permissions
    table.grantWriteData(createItemLambda);
    table.grantReadData(getItemLambda);
    table.grantReadData(listItemsLambda);
    table.grantWriteData(deleteItemLambda);

    // 7. Authorizer
    const authLambda = new nodejs.NodejsFunction(this, 'authorizerLambda', {
      entry: path.join(__dirname, '../../backend/src/auth/authorizer.ts'),
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      environment: {
        USER_POOL_ID: props.auth.userPool.userPoolId,
        USER_POOL_CLIENT_ID: props.auth.userPoolClient.userPoolClientId,
        POLICY_STORE_ID: props.auth.policyStoreId,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        // aws-jwt-verify is a dependency, verifiedpermissions client is too.
        // NodejsFunction bundles dependencies in package.json by default if not in externalModules.
        // We should ensure they are bundled or layer is used. 
        // Default bundling is usually fine for these.
      },
    });

    // Grant Authorizer permission to call IsAuthorized
    authLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['verifiedpermissions:IsAuthorized'],
      resources: [`arn:aws:verifiedpermissions:${this.region}:${this.account}:policy-store/${props.auth.policyStoreId}`],
    }));

    const authorizer = new apigateway.TokenAuthorizer(this, 'APIGatewayAuthorizer', {
      handler: authLambda,
      resultsCacheTtl: cdk.Duration.seconds(0), // Disable cache for testing
    });

    // 8. EventBridge Setup
    const eventBus = new events.EventBus(this, 'HmaasEventBus', {
      eventBusName: `HmaasEventBus-${props.stageName}`,
    });

    const processEventLambda = new nodejs.NodejsFunction(this, 'processEventLambda', {
      entry: path.join(backendPath, 'processEvent.ts'),
      ...commonProps,
    });

    // Rule: Trigger on 'ItemCreated' from 'hmaas.api'
    new events.Rule(this, 'ItemCreatedRule', {
      eventBus: eventBus,
      eventPattern: {
        source: ['hmaas.api'],
        detailType: ['ItemCreated'],
      },
      targets: [new targets.LambdaFunction(processEventLambda)],
    });

    // Grant Publish permissions to API Lambdas
    eventBus.grantPutEventsTo(createItemLambda);
    eventBus.grantPutEventsTo(deleteItemLambda);

    // Add EVENT_BUS_NAME to Lambda environment
    createItemLambda.addEnvironment('EVENT_BUS_NAME', eventBus.eventBusName);
    deleteItemLambda.addEnvironment('EVENT_BUS_NAME', eventBus.eventBusName);

    // 5. API Gateway Integrations
    const items = api.root.addResource('items');
    items.addMethod('GET', new apigateway.LambdaIntegration(listItemsLambda), { authorizer });
    items.addMethod('POST', new apigateway.LambdaIntegration(createItemLambda), { authorizer });

    const item = items.addResource('{itemId}');
    item.addMethod('GET', new apigateway.LambdaIntegration(getItemLambda), { authorizer });
    item.addMethod('DELETE', new apigateway.LambdaIntegration(deleteItemLambda), { authorizer });

    // Output API URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
    });


  }
}
