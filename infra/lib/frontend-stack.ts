import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { NagSuppressions } from 'cdk-nag';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as path from 'path';

export class FrontendStack extends cdk.Stack {
    public readonly prodBucket: s3.Bucket;
    public readonly nonProdBucket: s3.Bucket;
    public readonly distribution: cloudfront.Distribution;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // ... existing buckets ...

        // --- Production (Placeholder) ---
        this.prodBucket = new s3.Bucket(this, 'ProdWebsiteBucket', {
            // ... existing config ...
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            autoDeleteObjects: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            encryption: s3.BucketEncryption.S3_MANAGED,
            enforceSSL: true,
        });

        // --- Non-Production (S3 Static Website Hosting) ---
        this.nonProdBucket = new s3.Bucket(this, 'NonProdWebsiteBucket', {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // Block all public access, access only via CloudFront
            encryption: s3.BucketEncryption.S3_MANAGED,
            enforceSSL: true,
        });

        // --- CloudFront Function for Clean URLs ---
        const rewriteFunction = new cloudfront.Function(this, 'RewriteFunction', {
            code: cloudfront.FunctionCode.fromInline(`
                function handler(event) {
                    var request = event.request;
                    var uri = request.uri;
                    
                    if (uri.endsWith('/')) {
                        request.uri += 'index.html';
                    } else if (!uri.includes('.')) {
                        request.uri += '.html';
                    }
                    
                    return request;
                }
            `),
        });

        // --- CloudFront Distribution ---
        this.distribution = new cloudfront.Distribution(this, 'NonProdDistribution', {
            defaultBehavior: {
                origin: origins.S3BucketOrigin.withOriginAccessControl(this.nonProdBucket),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
                functionAssociations: [
                    {
                        function: rewriteFunction,
                        eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
                    },
                ],
            },
            defaultRootObject: 'index.html',
            errorResponses: [
                {
                    httpStatus: 403,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                    ttl: cdk.Duration.seconds(0),
                },
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                    ttl: cdk.Duration.seconds(0),
                },
            ],
        });

        // --- Deployment ---
        new s3deploy.BucketDeployment(this, 'DeployWebsite', {
            sources: [s3deploy.Source.asset(path.join(__dirname, '../../frontend/out'))],
            destinationBucket: this.nonProdBucket,
            distribution: this.distribution, // Invalidate CloudFront cache
            distributionPaths: ['/*'],
            prune: true,
        });

        // ... existing outputs and suppressions ...
        new cdk.CfnOutput(this, 'ProdBucketName', { value: this.prodBucket.bucketName });

        new cdk.CfnOutput(this, 'NonProdBucketName', { value: this.nonProdBucket.bucketName });
        new cdk.CfnOutput(this, 'NonProdWebsiteUrl', {
            value: `https://${this.distribution.distributionDomainName}`,
            description: 'URL for the CloudFront distribution'
        });

        new cdk.CfnOutput(this, 'NonProdDistributionId', {
            value: this.distribution.distributionId,
        });

        NagSuppressions.addStackSuppressions(this, [
            { id: 'AwsSolutions-CFR1', reason: 'Geo restrictions not required for dev' },
            { id: 'AwsSolutions-CFR2', reason: 'WAF not required for dev frontend distribution' },
            { id: 'AwsSolutions-CFR3', reason: 'Logging not required for dev distribution' },
            { id: 'AwsSolutions-CFR4', reason: 'Using default CloudFront certificate for dev' },
            { id: 'AwsSolutions-S1', reason: 'Server access logging not required for dev' },
            { id: 'AwsSolutions-L1', reason: 'BucketDeployment custom resource' },
            { id: 'AwsSolutions-IAM5', reason: 'BucketDeployment needs wildcard permissions' },
            { id: 'AwsSolutions-IAM4', reason: 'BucketDeployment uses managed policy' },
        ]);
    }
}
