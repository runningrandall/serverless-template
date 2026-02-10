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
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';

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

    // ─── 1. DynamoDB Table ───
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
        Version: '1',
      },
    });

    // ─── 2. SNS Alarm Topic ───
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `${props.stageName}-AlarmTopic`,
      displayName: `${props.stageName} Service Alarms`,
    });

    // Output for subscribing email
    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'Subscribe to this topic for alarm notifications: aws sns subscribe --topic-arn <ARN> --protocol email --notification-endpoint <email>',
    });

    // ─── 3. Dead Letter Queues ───
    const lambdaDLQ = new sqs.Queue(this, 'LambdaDLQ', {
      queueName: `${props.stageName}-LambdaDLQ`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
    });

    // DLQ alarm — alert if messages arrive in the DLQ
    const dlqAlarm = new cloudwatch.Alarm(this, 'DLQMessagesAlarm', {
      metric: lambdaDLQ.metricApproximateNumberOfMessagesVisible({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      alarmDescription: 'Messages in Lambda DLQ — indicates Lambda failures',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    dlqAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // ─── 4. API Gateway ───
    const api = new apigateway.RestApi(this, 'TemplateApi', {
      restApiName: `Template Service ${props.stageName}`,
      description: 'This service serves the template app.',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
      deployOptions: {
        stageName: props.stageName,
      },
    });

    // ─── 5. WAF Web ACL ───
    const webAcl = new wafv2.CfnWebACL(this, 'ApiWaf', {
      defaultAction: { allow: {} },
      scope: 'REGIONAL',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `${props.stageName}-ApiWaf`,
        sampledRequestsEnabled: true,
      },
      rules: [
        // Rate limiting: 1000 requests per 5 minutes per IP
        {
          name: 'RateLimitRule',
          priority: 1,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: 1000,
              aggregateKeyType: 'IP',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
            sampledRequestsEnabled: true,
          },
        },
        // AWS Managed Common Rule Set (blocks known bad inputs)
        {
          name: 'AWSManagedCommonRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedCommonRuleSet',
            sampledRequestsEnabled: true,
          },
        },
        // AWS Managed Known Bad Inputs
        {
          name: 'AWSManagedKnownBadInputs',
          priority: 3,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedKnownBadInputs',
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    // Associate WAF with API Gateway
    new wafv2.CfnWebACLAssociation(this, 'ApiWafAssociation', {
      resourceArn: api.deploymentStage.stageArn,
      webAclArn: webAcl.attrArn,
    });

    // ─── 6. Lambda Functions ───
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
        externalModules: ['aws-sdk'],
      },
      tracing: lambda.Tracing.ACTIVE,
      deadLetterQueue: lambdaDLQ,
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

    // ── Category Lambdas ──
    const createCategoryLambda = new nodejs.NodejsFunction(this, 'createCategoryLambda', {
      entry: path.join(backendPath, 'createCategory.ts'),
      ...commonProps,
    });

    const getCategoryLambda = new nodejs.NodejsFunction(this, 'getCategoryLambda', {
      entry: path.join(backendPath, 'getCategory.ts'),
      ...commonProps,
    });

    const listCategorysLambda = new nodejs.NodejsFunction(this, 'listCategorysLambda', {
      entry: path.join(backendPath, 'listCategorys.ts'),
      ...commonProps,
    });

    const deleteCategoryLambda = new nodejs.NodejsFunction(this, 'deleteCategoryLambda', {
      entry: path.join(backendPath, 'deleteCategory.ts'),
      ...commonProps,
    });

    // 7. Permissions
    table.grantWriteData(createItemLambda);
    table.grantReadData(getItemLambda);
    table.grantReadData(listItemsLambda);
    table.grantWriteData(deleteItemLambda);

    table.grantWriteData(createCategoryLambda);
    table.grantReadData(getCategoryLambda);
    table.grantReadData(listCategorysLambda);
    table.grantWriteData(deleteCategoryLambda);

    // ─── 8. Authorizer ───
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

    authLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['verifiedpermissions:IsAuthorized'],
      resources: [`arn:aws:verifiedpermissions:${this.region}:${this.account}:policy-store/${props.auth.policyStoreId}`],
    }));

    const authorizer = new apigateway.TokenAuthorizer(this, 'APIGatewayAuthorizer', {
      handler: authLambda,
      resultsCacheTtl: cdk.Duration.seconds(0),
    });

    // ─── 9. EventBridge ───
    const eventBus = new events.EventBus(this, 'HmaasEventBus', {
      eventBusName: `HmaasEventBus-${props.stageName}`,
    });

    const processEventLambda = new nodejs.NodejsFunction(this, 'processEventLambda', {
      entry: path.join(backendPath, 'processEvent.ts'),
      ...commonProps,
    });

    new events.Rule(this, 'ItemCreatedRule', {
      eventBus: eventBus,
      eventPattern: {
        source: ['hmaas.api'],
        detailType: ['ItemCreated'],
      },
      targets: [new targets.LambdaFunction(processEventLambda, {
        deadLetterQueue: lambdaDLQ,
      })],
    });

    eventBus.grantPutEventsTo(createItemLambda);
    eventBus.grantPutEventsTo(deleteItemLambda);
    createItemLambda.addEnvironment('EVENT_BUS_NAME', eventBus.eventBusName);
    deleteItemLambda.addEnvironment('EVENT_BUS_NAME', eventBus.eventBusName);

    eventBus.grantPutEventsTo(createCategoryLambda);
    eventBus.grantPutEventsTo(deleteCategoryLambda);
    createCategoryLambda.addEnvironment('EVENT_BUS_NAME', eventBus.eventBusName);
    deleteCategoryLambda.addEnvironment('EVENT_BUS_NAME', eventBus.eventBusName);

    // ─── 10. API Gateway Routes ───
    const items = api.root.addResource('items');
    items.addMethod('GET', new apigateway.LambdaIntegration(listItemsLambda), { authorizer });
    items.addMethod('POST', new apigateway.LambdaIntegration(createItemLambda), { authorizer });

    const item = items.addResource('{itemId}');
    item.addMethod('GET', new apigateway.LambdaIntegration(getItemLambda), { authorizer });
    item.addMethod('DELETE', new apigateway.LambdaIntegration(deleteItemLambda), { authorizer });

    const categories = api.root.addResource('categories');
    categories.addMethod('GET', new apigateway.LambdaIntegration(listCategorysLambda), { authorizer });
    categories.addMethod('POST', new apigateway.LambdaIntegration(createCategoryLambda), { authorizer });

    const category = categories.addResource('{categoryId}');
    category.addMethod('GET', new apigateway.LambdaIntegration(getCategoryLambda), { authorizer });
    category.addMethod('DELETE', new apigateway.LambdaIntegration(deleteCategoryLambda), { authorizer });


    // ─── 11. API Gateway Usage Plan & API Key ───
    const usagePlan = api.addUsagePlan('UsagePlan', {
      name: `${props.stageName}-UsagePlan`,
      description: 'Rate limiting usage plan',
      throttle: {
        rateLimit: 100,   // requests per second
        burstLimit: 200,  // burst capacity
      },
      quota: {
        limit: 10000,        // requests per day
        period: apigateway.Period.DAY,
      },
    });
    usagePlan.addApiStage({ stage: api.deploymentStage });

    // Output API URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
    });

    // ─── 12. CloudWatch Alarms ───
    const allLambdas = [createItemLambda, getItemLambda, listItemsLambda, deleteItemLambda, createCategoryLambda, getCategoryLambda, listCategorysLambda, deleteCategoryLambda, processEventLambda, authLambda];

    // API Gateway 5xx error alarm
    const api5xxAlarm = new cloudwatch.Alarm(this, 'Api5xxAlarm', {
      metric: api.metricServerError({ period: cdk.Duration.minutes(5) }),
      threshold: 5,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      alarmDescription: 'API Gateway 5xx error rate is elevated',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    api5xxAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // API Gateway high latency alarm (p99 > 3s)
    const apiLatencyAlarm = new cloudwatch.Alarm(this, 'ApiLatencyAlarm', {
      metric: api.metricLatency({ statistic: 'p99', period: cdk.Duration.minutes(5) }),
      threshold: 3000,
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      alarmDescription: 'API Gateway p99 latency > 3 seconds',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    apiLatencyAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // Lambda error alarm (aggregated across all functions)
    for (const fn of allLambdas) {
      const alarm = new cloudwatch.Alarm(this, `${fn.node.id}ErrorAlarm`, {
        metric: fn.metricErrors({ period: cdk.Duration.minutes(5) }),
        threshold: 3,
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        alarmDescription: `Lambda ${fn.node.id} error rate is elevated`,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
      alarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));
    }

    // DynamoDB throttle alarm
    const dynamoThrottleAlarm = new cloudwatch.Alarm(this, 'DynamoThrottleAlarm', {
      metric: table.metric('ReadThrottleEvents', { period: cdk.Duration.minutes(5) }),
      threshold: 1,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      alarmDescription: 'DynamoDB read throttle events detected',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    dynamoThrottleAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // ─── 13. CloudWatch Dashboard ───
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

    // DLQ widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Dead Letter Queue - Messages',
        left: [
          lambdaDLQ.metricApproximateNumberOfMessagesVisible({ period: cdk.Duration.minutes(5) }),
          lambdaDLQ.metricNumberOfMessagesSent({ period: cdk.Duration.minutes(5) }),
        ],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'WAF - Blocked Requests',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/WAFV2',
            metricName: 'BlockedRequests',
            dimensionsMap: {
              WebACL: webAcl.attrArn.split('/').pop()!,
              Rule: 'ALL',
              Region: this.region,
            },
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 12,
      }),
    );

    // ─── 14. cdk-nag suppressions ───
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
      { id: 'AwsSolutions-SQS3', reason: 'Lambda DLQ is the terminal queue — no further DLQ needed' },
      { id: 'AwsSolutions-SNS2', reason: 'SNS topic encryption not required for alarm notifications in template' },
      { id: 'AwsSolutions-SNS3', reason: 'SNS topic does not need to enforce SSL for alarm notifications' },
      { id: 'AwsSolutions-APIG3', reason: 'WAF is associated via CfnWebACLAssociation at regional scope' },
    ], true);
  }
}
