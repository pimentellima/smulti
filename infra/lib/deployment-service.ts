import { CfnOutput, Duration, RemovalPolicy } from 'aws-cdk-lib'
import { HttpApi } from 'aws-cdk-lib/aws-apigatewayv2'
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager'
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
import { HttpOrigin, S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins'
import { Rule, Schedule } from 'aws-cdk-lib/aws-events'
import { LambdaFunction as LambdaFunctionTarget } from 'aws-cdk-lib/aws-events-targets'
import {
    DockerImageCode,
    DockerImageFunction,
    Runtime,
} from 'aws-cdk-lib/aws-lambda'
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources'
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs'
import {
    AaaaRecord,
    ARecord,
    HostedZone,
    RecordTarget,
} from 'aws-cdk-lib/aws-route53'
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets'
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3'
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment'
import { Queue } from 'aws-cdk-lib/aws-sqs'
import { Construct } from 'constructs'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../../.env') })

export class DeploymentService extends Construct {
    constructor(scope: Construct, id: string) {
        super(scope, id)

        // Bucket de estáticos do front end com acesso público desabilitado
        const staticAssetsBucket = new Bucket(this, 'StaticAssetsBucket', {
            bucketName: process.env.S3_STATIC_BUCKET_NAME!,
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            publicReadAccess: false,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        })

        // Bucket de uploads com acesso público permitido
        const uploadsBucket = new Bucket(this, 'UploadsBucket', {
            bucketName: process.env.S3_UPLOADS_BUCKET_NAME!,
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: false,
            publicReadAccess: true,
            blockPublicAccess: BlockPublicAccess.BLOCK_ACLS_ONLY,
        })

        // Origem CloudFront para o bucket de estáticos com acesso via OriginAccessIdentity
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

        // Bundling e deploy da função Lambda do app web SSR
        const ssr = new NodejsFunction(this, 'SsrServerFunction', {
            runtime: Runtime.NODEJS_20_X,
            entry: resolve(__dirname, '../../apps/web/server.js'),
            handler: 'handler',
            timeout: Duration.seconds(29),
            environment: {
                S3_STATIC_BUCKET_NAME: process.env.S3_STATIC_BUCKET_NAME!,
                S3_UPLOADS_BUCKET_NAME: process.env.S3_UPLOADS_BUCKET_NAME!,
                DATABASE_URL: process.env.DATABASE_URL!,
                SQS_PROCESS_QUEUE_NAME: process.env.SQS_PROCESS_QUEUE_NAME!,
                VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL!,
                VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY!,
            },
            bundling: {
                format: OutputFormat.CJS,
                platform: 'node',
                target: 'node20',
                externalModules: ['@aws-sdk/*'],
            },
        })
        // Concede permissão de leitura e escrita no uploadsBucket para a função SSR
        uploadsBucket.grantReadWrite(ssr)

        // Api gateway integrada com o lambda SSR
        const httpApi = new HttpApi(this, 'SsrHttpApi', {
            defaultIntegration: new HttpLambdaIntegration(
                'SsrHttpIntegration',
                ssr,
            ),
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

        // Certificado emitido no ACM para usar no CloudFront
        const certificate = Certificate.fromCertificateArn(
            this,
            'Cert',
            'arn:aws:acm:us-east-1:412381757672:certificate/53ba8653-7430-4efe-8ab0-d74eba277eb8',
        )

        // Distribuição CloudFront com a API, bucket de estáticos e certificado
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

        // Zona dns gerada no Route53
        const zone = HostedZone.fromLookup(this, 'HostedZone', {
            domainName: 'smultidownloader.com',
        })

        // Registros www do dns apontando para o CloudFront

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

        new ARecord(this, 'RootAlias', {
            zone,
            target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
        })

        new AaaaRecord(this, 'RootAliasIPv6', {
            zone,
            target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
        })

        // Fila SQS para processamento de jobs
        const processQueue = new Queue(this, 'ProcessQueue', {
            queueName: process.env.SQS_PROCESS_QUEUE_NAME,
            visibilityTimeout: Duration.minutes(6),
        })
        // Concede permissão para a função SSR enviar mensagens para o processQueue
        processQueue.grantSendMessages(ssr)

        // Deploy da função Lambda de processamento de jobs a partir de uma imagem Docker
        const processFunction = new DockerImageFunction(
            this,
            'ProcessFunction',
            {
                timeout: Duration.minutes(5),
                code: DockerImageCode.fromImageAsset(
                    resolve(__dirname, '../../functions/worker'),
                    {
                        file: 'Dockerfile', // caminho relativo ao diretório atual
                    },
                ),
                environment: {
                    DATABASE_URL: process.env.DATABASE_URL!,
                },
            },
        )

        // Conecta SQS a Lambda
        processFunction.addEventSource(new SqsEventSource(processQueue))

        // Função Lambda para enfileirar jobs periodicamente
        const cronLambda = new NodejsFunction(this, 'EnqueLambda', {
            runtime: Runtime.NODEJS_20_X,
            handler: 'handler',
            entry: resolve(
                __dirname,
                '../../functions/enque/src/index.ts',
            ),
            bundling: {
                format: OutputFormat.CJS,
                platform: 'node',
                target: 'node20',
                externalModules: ['@aws-sdk/*'],
            },
            environment: {
                DATABASE_URL: process.env.DATABASE_URL!,
                SQS_PROCESS_QUEUE_NAME: process.env.SQS_PROCESS_QUEUE_NAME!,
            },
            timeout: Duration.seconds(30),
        })

        // Regra do EventBridge para rodar a cada X segundos
        const rule = new Rule(this, 'CronRule', {
            schedule: Schedule.rate(Duration.minutes(1)),
        })

        // Adiciona a Lambda como alvo da regra
        rule.addTarget(new LambdaFunctionTarget(cronLambda))

        /// Deploy de buckets s3
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
