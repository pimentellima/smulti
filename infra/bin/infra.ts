#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { DeployStack } from '../lib/app-stack'

const app = new cdk.App()
new DeployStack(app, 'SmultiStack', {
    env: {
        account: '412381757672',
        region: 'us-east-1',
    },
})
