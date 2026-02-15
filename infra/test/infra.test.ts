
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { InfraStack } from '../lib/infra-stack';
import { AuthStack } from '../lib/auth-stack';

test('Infra Stack Created', () => {
    const app = new cdk.App();
    // WHEN
    const authStack = new AuthStack(app, 'AuthStack', {
        stageName: 'test',
    });
    const infraStack = new InfraStack(app, 'InfraStack', {
        auth: authStack,
        stageName: 'test',
        frontendUrl: 'http://localhost:3000',
    });

    // THEN
    const template = Template.fromStack(infraStack);

    // Verify DynamoDB Table
    template.resourceCountIs('AWS::DynamoDB::Table', 1);
    template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
    });

    // Verify API Gateway
    template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'Template Service test',
    });


});

test('Auth Stack Created', () => {
    const app = new cdk.App();
    const authStack = new AuthStack(app, 'AuthStack', {
        stageName: 'test',
    });
    const template = Template.fromStack(authStack);

    // Verify User Pool
    template.hasResourceProperties('AWS::Cognito::UserPool', {
        AutoVerifiedAttributes: ['email'],
    });

    // Verify User Pool Client
    template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
        ClientName: 'frontend-client',
    });
});
