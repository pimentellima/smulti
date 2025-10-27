import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { DeploymentService } from './deployment-service'
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../.env') });

export class DeployStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)
        console.log(process.env.S3_STATIC_BUCKET_NAME)

        new DeploymentService(this, 'deployment', {
            s3StaticBucketName: process.env.S3_STATIC_BUCKET_NAME!,
            s3FilesBucketName: process.env.S3_UPLOADS_BUCKET_NAME!,
            region: 'us-east-1',
            apiName: 'ssr-api',
        })
    }
}
