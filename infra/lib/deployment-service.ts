import { Construct } from 'constructs'
import { CfnOutput, Duration, RemovalPolicy, StackProps } from 'aws-cdk-lib'
import {
    AllowedMethods,
    CacheCookieBehavior,
    CachedMethods,
    CacheHeaderBehavior,
    CachePolicy,
    CacheQueryStringBehavior,
    Distribution,
    OriginAccessIdentity,
    ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront'
import {
    HttpOrigin,
    S3Origin,
    S3StaticWebsiteOrigin,
} from 'aws-cdk-lib/aws-cloudfront-origins'
import { BlockPublicAccess, Bucket, BucketPolicy } from 'aws-cdk-lib/aws-s3'
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment'
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda'
import { resolve } from 'path'
import {
    CanonicalUserPrincipal,
    PolicyDocument,
    PolicyStatement,
} from 'aws-cdk-lib/aws-iam'
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import { HttpApi } from 'aws-cdk-lib/aws-apigatewayv2'
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53'
import {
    Certificate,
    ValidationMethod,
} from 'aws-cdk-lib/aws-certificatemanager'
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets'
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs'

interface MyStackProps extends StackProps {
    s3StaticBucketName: string
    s3FilesBucketName: string
    region: string
    apiName: string
}

export class DeploymentService extends Construct {
    constructor(scope: Construct, id: string, props: MyStackProps) {
        super(scope, id)

        // Definição de Buckets S3

        const staticAssetsBucket = new Bucket(this, 'StaticAssetsBucket', {
            bucketName: props.s3StaticBucketName,
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            publicReadAccess: false,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        })

        const uploadsBucket = new Bucket(this, 'UploadsBucket', {
            bucketName: props.s3FilesBucketName,
            removalPolicy: RemovalPolicy.RETAIN,
            autoDeleteObjects: false,
            publicReadAccess: true,
            blockPublicAccess: BlockPublicAccess.BLOCK_ACLS_ONLY,
        })

        const oai = new OriginAccessIdentity(
            this,
            'StaticAssetsAccessIdentity',
            {
                comment: `Origin Access Identity to access website bucket ${props.s3StaticBucketName}`,
            },
        )
        staticAssetsBucket.grantRead(oai)
        const staticAssetsOrigin = new S3Origin(staticAssetsBucket, {
            originAccessIdentity: oai,
        })

        // Deploy SSR Lambda e criação de Api Gateway

        const ssr = new NodejsFunction(this, 'SsrServerFunction', {
            runtime: Runtime.NODEJS_20_X,
            entry: resolve(__dirname, '../../apps/web/server.js'),
            handler: 'handler',
            timeout: Duration.seconds(29),
            bundling: {
                format: OutputFormat.CJS,
                platform: 'node',
                target: 'node20',
                externalModules: ['@aws-sdk/*'],
            },
        })

        const integration = new HttpLambdaIntegration('SsrHttpIntegration', ssr)

        const httpApi = new HttpApi(this, 'SsrHttpApi', {
            apiName: props.apiName,
            defaultIntegration: integration,
            createDefaultStage: true,
        })

        // Política de Cache CloudFront
        const cachePolicy = new CachePolicy(this, 'CachePolicy', {
            cachePolicyName: 'CachePolicy',
            defaultTtl: Duration.seconds(60),
            minTtl: Duration.seconds(0),
            maxTtl: Duration.seconds(60),
            headerBehavior: CacheHeaderBehavior.allowList('Accept-Language'),
            cookieBehavior: CacheCookieBehavior.all(),
            queryStringBehavior: CacheQueryStringBehavior.all(),
            enableAcceptEncodingGzip: true,
        })

        // Distribuição CloudFront

        /*         const zone = HostedZone.fromLookup(this, 'Zone', {
            domainName: 'smultidownloader.com',
        })

        const certificate = new Certificate(this, 'Cert', {
            domainName: 'smultidownloader.com',
            validation: {
                method: ValidationMethod.DNS,
                props: { hostedZone: zone },
            },
        }) */

        const distribution = new Distribution(this, 'CloudfrontDistribution', {
            defaultBehavior: {
                origin: new HttpOrigin(
                    `${httpApi.apiId}.execute-api.${props.region}.amazonaws.com`,
                ),
                viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            },
            // certificate,
            additionalBehaviors: {
                'assets/*': {
                    origin: staticAssetsOrigin,
                    allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
                    cachedMethods: CachedMethods.CACHE_GET_HEAD,
                    compress: true,
                    cachePolicy,
                    viewerProtocolPolicy:
                        ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                },
                '/favicon.*': {
                    origin: staticAssetsOrigin,
                    allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
                    cachedMethods: CachedMethods.CACHE_GET_HEAD,
                    compress: false,
                    cachePolicy,
                    viewerProtocolPolicy:
                        ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                },
            },
        })

        /*      const record = new ARecord(this, 'AliasRecord', {
            zone,
            recordName: 'smultidownloader.com',
            target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
        })
 */
        /// Deploy buckets s3

        new BucketDeployment(this, 'StaticAssetsBucketDeployment', {
            sources: [
                Source.asset(resolve(__dirname, '../../apps/web/build/client')),
            ],
            destinationBucket: staticAssetsBucket,
            distribution,
            distributionPaths: ['/*'],
        })

        new BucketDeployment(this, 'BucketDeployment', {
            sources: [],
            destinationBucket: uploadsBucket,
        })

        /// Outputs
        new CfnOutput(this, 'ApiUrl', {
            value: httpApi.apiEndpoint,
        })

        new CfnOutput(this, 'CloudFrontUrl', {
            value: distribution.distributionDomainName,
        })
    }
}
