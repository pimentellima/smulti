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
import {
    Code,
    DockerImageCode,
    DockerImageFunction,
    Function,
    Runtime,
} from 'aws-cdk-lib/aws-lambda'
import { resolve } from 'path'
import {
    CanonicalUserPrincipal,
    ManagedPolicy,
    PolicyDocument,
    PolicyStatement,
    Role,
    ServicePrincipal,
} from 'aws-cdk-lib/aws-iam'
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import { HttpApi } from 'aws-cdk-lib/aws-apigatewayv2'
import {
    AaaaRecord,
    ARecord,
    HostedZone,
    RecordTarget,
} from 'aws-cdk-lib/aws-route53'
import {
    Certificate,
    ValidationMethod,
} from 'aws-cdk-lib/aws-certificatemanager'
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets'
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs'
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources'
import { Queue } from 'aws-cdk-lib/aws-sqs'
import { config } from 'dotenv'

config({ path: resolve(__dirname, '../../.env') })

interface MyStackProps extends StackProps {
    apiName: string
}

export class DeploymentService extends Construct {
    constructor(scope: Construct, id: string, props: MyStackProps) {
        super(scope, id)

        // Definição de Buckets S3

        const staticAssetsBucket = new Bucket(this, 'StaticAssetsBucket', {
            bucketName: process.env.S3_STATIC_BUCKET_NAME!,
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            publicReadAccess: false,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        })

        const uploadsBucket = new Bucket(this, 'UploadsBucket', {
            bucketName: process.env.S3_UPLOADS_BUCKET_NAME!,
            removalPolicy: RemovalPolicy.RETAIN,
            autoDeleteObjects: false,
            publicReadAccess: true,
            blockPublicAccess: BlockPublicAccess.BLOCK_ACLS_ONLY,
        })

        const oai = new OriginAccessIdentity(
            this,
            'StaticAssetsAccessIdentity',
            {
                comment: `Origin Access Identity to access website bucket ${process.env.S3_STATIC_BUCKET_NAME!}`,
            },
        )
        staticAssetsBucket.grantRead(oai)
        const staticAssetsOrigin = new S3Origin(staticAssetsBucket, {
            originAccessIdentity: oai,
        })

        // Deploy SSR Lambda e criação de Api Gateway

        const ssrRole = new Role(this, 'SsrLambdaRole', {
            assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
            description:
                'Role for SSR Lambda with access to environment resources',
            managedPolicies: [
                ManagedPolicy.fromAwsManagedPolicyName(
                    'service-role/AWSLambdaBasicExecutionRole',
                ),

                ManagedPolicy.fromAwsManagedPolicyName(
                    'AmazonS3ReadOnlyAccess',
                ),
                ManagedPolicy.fromAwsManagedPolicyName(
                    'SecretsManagerReadWrite',
                ),
            ],
        })

        const ssr = new NodejsFunction(this, 'SsrServerFunction', {
            runtime: Runtime.NODEJS_20_X,
            entry: resolve(__dirname, '../../apps/web/server.js'),
            handler: 'handler',
            timeout: Duration.seconds(29),
            role: ssrRole,
            environment: {
                S3_STATIC_BUCKET_NAME: process.env.S3_STATIC_BUCKET_NAME!,
                S3_UPLOADS_BUCKET_NAME: process.env.S3_UPLOADS_BUCKET_NAME!,
                DATABASE_URL: process.env.DATABASE_URL!,
                SQS_PROCESS_QUEUE_NAME: process.env.SQS_PROCESS_QUEUE_NAME!,
                SQS_CONVERT_QUEUE_NAME: process.env.SQS_CONVERT_QUEUE_NAME!,
            },
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

        const certificate = Certificate.fromCertificateArn(
            this,
            'Cert',
            'arn:aws:acm:us-east-1:412381757672:certificate/53ba8653-7430-4efe-8ab0-d74eba277eb8',
        )

        const distribution = new Distribution(this, 'CloudfrontDistribution', {
            defaultBehavior: {
                origin: new HttpOrigin(
                    `${httpApi.apiId}.execute-api.${process.env.AWS_REGION}.amazonaws.com`,
                ),
                allowedMethods: AllowedMethods.ALLOW_ALL,
                viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            },
            certificate,
            domainNames: ['www.smultidownloader.com', 'smultidownloader.com'],
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

        // A zona precisa ser criada no Route53 antes do deploy
        const zone = HostedZone.fromLookup(this, 'HostedZone', {
            domainName: 'smultidownloader.com',
        })

        new ARecord(this, 'RootAlias', {
            zone,
            recordName: '@',
            target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
        })

        new AaaaRecord(this, 'RootAliasIPv6', {
            zone,
            recordName: '@',
            target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
        })

        new ARecord(this, 'WwwAlias', {
            zone,
            recordName: 'www',
            target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
        })

        new AaaaRecord(this, 'WwwAliasIPv6', {
            zone,
            recordName: 'www',
            target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
        })

        // Fila SQS
        const processQueue = new Queue(this, 'ProcessQueue', {
            queueName: process.env.SQS_PROCESS_QUEUE_NAME,
        })
        // Lambda com imagem Docker local
        const processFunction = new DockerImageFunction(
            this,
            'ProcessFunction',
            {
                functionName: 'smulti-process-worker',
                code: DockerImageCode.fromImageAsset(
                    resolve(__dirname, '../../functions/process-worker'),
                    {
                        file: 'Dockerfile', // caminho relativo ao diretório atual
                    },
                ),
                environment: {
                    DATABASE_URL: process.env.DATABASE_URL!,
                },
            },
        )

        // Conecta SQS → Lambda
        processFunction.addEventSource(new SqsEventSource(processQueue))

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
