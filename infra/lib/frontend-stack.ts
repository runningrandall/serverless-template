import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

export class FrontendStack extends cdk.Stack {
    public readonly prodBucket: s3.Bucket;
    public readonly nonProdBucket: s3.Bucket;
    public readonly prodDistribution: cloudfront.Distribution;
    public readonly nonProdDistribution: cloudfront.Distribution;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // --- Production ---
        this.prodBucket = new s3.Bucket(this, 'ProdWebsiteBucket', {
            removalPolicy: cdk.RemovalPolicy.RETAIN, // Keep prod data
            autoDeleteObjects: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            encryption: s3.BucketEncryption.S3_MANAGED,
        });

        this.prodDistribution = new cloudfront.Distribution(this, 'ProdDistribution', {
            defaultBehavior: {
                origin: new origins.S3Origin(this.prodBucket),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
                compress: true,
            },
            defaultRootObject: 'index.html',
            errorResponses: [
                {
                    httpStatus: 403,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                    ttl: cdk.Duration.minutes(0),
                },
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                    ttl: cdk.Duration.minutes(0),
                },
            ],
            priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        });

        // --- Non-Production ---
        this.nonProdBucket = new s3.Bucket(this, 'NonProdWebsiteBucket', {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            encryption: s3.BucketEncryption.S3_MANAGED,
        });

        this.nonProdDistribution = new cloudfront.Distribution(this, 'NonProdDistribution', {
            defaultBehavior: {
                origin: new origins.S3Origin(this.nonProdBucket),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
                compress: true,
            },
            // For non-prod with path-based routing (e.g. /branch-name/), 
            // specific error pages per branch are hard in S3/CF without Lambda@Edge.
            // However, typical SPA routing might just start at /branch-name/index.html
            // If the user hits /branch-name/foo and it doesn't exist, S3 404s.
            // We can't easily redirect to /branch-name/index.html generically for ANY branch.
            // But Next.js static export with basePath might just work if we rely on index.html

            // We will allow 404 to pass through or just default to root index.html?
            // Defaulting to root index.html would break branch routing.
            // So we might NOT set extensive error responses here, or we accept that
            // direct deep links might 404 if not perfectly matched to a file.
            // Ideally, we'd use a Function, but for now let's keep it simple.
            priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        });

        // --- Outputs ---
        new cdk.CfnOutput(this, 'ProdBucketName', { value: this.prodBucket.bucketName });
        new cdk.CfnOutput(this, 'ProdDistributionId', { value: this.prodDistribution.distributionId });
        new cdk.CfnOutput(this, 'ProdDistributionDomain', { value: this.prodDistribution.distributionDomainName });

        new cdk.CfnOutput(this, 'NonProdBucketName', { value: this.nonProdBucket.bucketName });
        new cdk.CfnOutput(this, 'NonProdDistributionId', { value: this.nonProdDistribution.distributionId });
        new cdk.CfnOutput(this, 'NonProdDistributionDomain', { value: this.nonProdDistribution.distributionDomainName });
    }
}
