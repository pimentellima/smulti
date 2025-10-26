import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { DeploymentService } from './deployment-service'

export class DeployStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)

        new DeploymentService(this, 'deployment', {
            s3StaticBucketName: process.env.S3_STATIC_BUCKET_NAME!,
            s3FilesBucketName: process.env.S3_UPLOADS_BUCKET_NAME!,
            region: 'us-east-1',
        })
    }
}
