import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

import * as iam from 'aws-cdk-lib/aws-iam';
import { AuthStack } from './auth-stack';
import { NagSuppressions } from 'cdk-nag';

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

    // 1b. DB Seed Custom Resource
    const seedLambda = new nodejs.NodejsFunction(this, 'seedDataLambda', {
      entry: path.join(__dirname, '../../backend/src/handlers/seedData.ts'),
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(30),
      environment: {
        TABLE_NAME: table.tableName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
      },
    });
    table.grantWriteData(seedLambda);

    new cdk.CustomResource(this, 'SeedDataResource', {
      serviceToken: seedLambda.functionArn,
      properties: {
        // Change this value to force re-seeding on next deploy
        Version: '1',
      },
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
      tracing: lambda.Tracing.ACTIVE,
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

    // ─── CloudWatch Dashboard ───
    const allLambdas = [createItemLambda, getItemLambda, listItemsLambda, deleteItemLambda, processEventLambda, authLambda];

    const dashboard = new cloudwatch.Dashboard(this, 'ServiceDashboard', {
      dashboardName: `${props.stageName}-ServiceDashboard`,
    });

    // API Gateway widgets
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway - Request Count',
        left: [api.metricCount({ period: cdk.Duration.minutes(5) })],
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway - 4xx / 5xx Errors',
        left: [
          api.metricClientError({ period: cdk.Duration.minutes(5) }),
          api.metricServerError({ period: cdk.Duration.minutes(5) }),
        ],
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway - Latency (p50, p90, p99)',
        left: [
          api.metricLatency({ statistic: 'p50', period: cdk.Duration.minutes(5) }),
          api.metricLatency({ statistic: 'p90', period: cdk.Duration.minutes(5) }),
          api.metricLatency({ statistic: 'p99', period: cdk.Duration.minutes(5) }),
        ],
        width: 8,
      }),
    );

    // Lambda widgets
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda - Invocations',
        left: allLambdas.map(fn => fn.metricInvocations({ period: cdk.Duration.minutes(5) })),
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda - Errors',
        left: allLambdas.map(fn => fn.metricErrors({ period: cdk.Duration.minutes(5) })),
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda - Duration (avg)',
        left: allLambdas.map(fn => fn.metricDuration({ period: cdk.Duration.minutes(5) })),
        width: 8,
      }),
    );

    // DynamoDB widgets
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'DynamoDB - Consumed Read/Write Capacity',
        left: [
          table.metricConsumedReadCapacityUnits({ period: cdk.Duration.minutes(5) }),
          table.metricConsumedWriteCapacityUnits({ period: cdk.Duration.minutes(5) }),
        ],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB - Throttled Requests',
        left: [
          table.metric('ReadThrottleEvents', { period: cdk.Duration.minutes(5) }),
          table.metric('WriteThrottleEvents', { period: cdk.Duration.minutes(5) }),
        ],
        width: 12,
      }),
    );

    // ─── cdk-nag suppressions for template-level acceptable patterns ───
    NagSuppressions.addStackSuppressions(this, [
      { id: 'AwsSolutions-APIG1', reason: 'Access logging not required for dev/template stage' },
      { id: 'AwsSolutions-APIG2', reason: 'Request validation handled by Middy middleware at handler level' },
      { id: 'AwsSolutions-APIG4', reason: 'Authorization is handled by Lambda Token Authorizer' },
      { id: 'AwsSolutions-APIG6', reason: 'Execution logging not required for dev/template stage' },
      { id: 'AwsSolutions-COG4', reason: 'Using Lambda Token Authorizer instead of Cognito Authorizer' },
      { id: 'AwsSolutions-DDB3', reason: 'Point-in-time recovery not required for dev/template stage' },
      { id: 'AwsSolutions-IAM4', reason: 'Managed policies acceptable for Lambda execution roles in template' },
      { id: 'AwsSolutions-IAM5', reason: 'Wildcard permissions acceptable for DynamoDB index access in template' },
      { id: 'AwsSolutions-L1', reason: 'Using Node.js 22.x which is current' },
      { id: 'AwsSolutions-SQS3', reason: 'No SQS queues used - EventBridge targets Lambda directly' },
    ], true);
  }
}

