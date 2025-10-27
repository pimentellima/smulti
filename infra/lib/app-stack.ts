import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { DeploymentService } from './deployment-service'
import { config } from 'dotenv';
import { resolve } from 'path';


export class DeployStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)

        new DeploymentService(this, 'deployment', {
            region: 'us-east-1',
            apiName: 'ssr-api',
        })
    }
}
