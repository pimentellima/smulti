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
import {
    Instance,
    InstanceClass,
    InstanceSize,
    InstanceType,
    MachineImage,
    Peer,
    Port,
    SecurityGroup,
    SubnetType,
    Vpc,
} from 'aws-cdk-lib/aws-ec2'
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets'
import { Rule, Schedule } from 'aws-cdk-lib/aws-events'
import { LambdaFunction as LambdaFunctionTarget } from 'aws-cdk-lib/aws-events-targets'
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import {
    DockerImageCode,
    DockerImageFunction,
    LayerVersion,
    Runtime,
} from 'aws-cdk-lib/aws-lambda'
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources'
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'
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

        // Bucket de uploads com acesso público
        const uploadsBucket = new Bucket(this, 'UploadsBucket', {
            bucketName: process.env.S3_UPLOADS_BUCKET_NAME!,
            removalPolicy: RemovalPolicy.RETAIN,
            autoDeleteObjects: false,
            publicReadAccess: true,
            blockPublicAccess: BlockPublicAccess.BLOCK_ACLS_ONLY,
        })

        // Bucket de estáticos do front end com acesso público desabilitado
        const staticAssetsBucket = new Bucket(this, 'StaticAssetsBucket', {
            bucketName: process.env.S3_STATIC_BUCKET_NAME!,
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            publicReadAccess: false,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
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

        // Fila DLQ
        const dlq = new Queue(this, 'DeadLetterQueue', {
            visibilityTimeout: Duration.seconds(60),
        })
        const dlqFunction = new NodejsFunction(this, 'DLQProcessor', {
            runtime: Runtime.NODEJS_20_X,
            handler: 'handler',
            entry: resolve(__dirname, '../../functions/dlq/src/index.ts'),
            environment: {
                DATABASE_URL: process.env.DATABASE_URL!,
            },
            timeout: Duration.seconds(45),
        })
        dlq.grantConsumeMessages(dlqFunction)
        dlqFunction.addEventSource(new SqsEventSource(dlq))

        // Fila SQS para processamento de jobs
        const processQueue = new Queue(this, 'ProcessQueue', {
            queueName: process.env.SQS_PROCESS_QUEUE_NAME,
            visibilityTimeout: Duration.minutes(6),
            deadLetterQueue: {
                queue: dlq,
                maxReceiveCount: 3,
            },
        })
        // Concede permissão para a função SSR enviar mensagens para o processQueue
        processQueue.grantSendMessages(ssr)

        const processDockerImage = new DockerImageAsset(
            this,
            'ProcessDockerImage',
            {
                directory: resolve(__dirname, '../../functions/process'),
            },
        )
        const processInstanceVpc = new Vpc(this, 'Vpc', { maxAzs: 2 })
        const processInstanceLogGroup = new LogGroup(
            this,
            'ProcessInstanceLogGroup',
            {
                logGroupName: '/aws/ec2/ProcessEC2Instance',
                retention: RetentionDays.ONE_WEEK,
                removalPolicy: RemovalPolicy.DESTROY,
            },
        )

        const ec2Role = new Role(this, 'EC2SSMRole', {
            assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
        })
        ec2Role.addManagedPolicy(
            ManagedPolicy.fromAwsManagedPolicyName(
                'AmazonSSMManagedInstanceCore',
            ),
        )

        ec2Role.addManagedPolicy(
            ManagedPolicy.fromAwsManagedPolicyName(
                'AmazonEC2ContainerRegistryReadOnly',
            ),
        )
        ec2Role.addManagedPolicy(
            ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
        )
        const sg = new SecurityGroup(this, 'MyEC2SG', {
            vpc: processInstanceVpc,
            description: 'Allow HTTP, SSH access',
            allowAllOutbound: true,
        })
        sg.addIngressRule(Peer.anyIpv4(), Port.tcp(22), 'SSH')
        sg.addIngressRule(Peer.anyIpv4(), Port.tcp(80), 'HTTP')
        const processInstance = new Instance(this, 'ProcessEC2Instance', {
            vpc: processInstanceVpc,
            instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.SMALL),
            machineImage: MachineImage.latestAmazonLinux2(),
            role: ec2Role,
            securityGroup: sg,
            keyName: 'process-ec2-key',
            vpcSubnets: { subnetType: SubnetType.PUBLIC },
            associatePublicIpAddress: true,
        })
        processDockerImage.repository.grantPull(processInstance.role)
        processQueue.grantConsumeMessages(processInstance)
        processQueue.grantPurge(processInstance)
        processInstance.userData.addCommands(
            '#!/bin/bash',
            'yum update -y',
            'amazon-linux-extras install docker -y',
            'service docker start',
            'usermod -a -G docker ec2-user',
            `aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${processDockerImage.repository.repositoryUri}`,
            `docker run -d -t \
                -e DATABASE_URL=${process.env.DATABASE_URL || ''} \
                -e SQS_QUEUE_URL=${processQueue.queueUrl || ''} \
                --log-driver=awslogs \
                --log-opt awslogs-group=${processInstanceLogGroup.logGroupName} \
                --log-opt awslogs-region=${process.env.AWS_REGION} \
                --log-opt awslogs-stream=container-1 \
                ${processDockerImage.imageUri}`,
        )

        // Função Lambda para enfileirar jobs periodicamente
        const cronLambda = new NodejsFunction(this, 'EnqueLambda', {
            runtime: Runtime.NODEJS_20_X,
            handler: 'handler',
            entry: resolve(__dirname, '../../functions/enque/src/index.ts'),
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

        new CfnOutput(this, 'LogGroupName', {
            value: processInstanceLogGroup.logGroupName,
        })
    }
}
