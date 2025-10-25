/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
    app(input) {
        return {
            name: 'SmultiApp',
            removal: input?.stage === 'production' ? 'retain' : 'remove',
            protect: ['production'].includes(input?.stage),
            home: 'aws',
        }
    },
    async run() {
        const storage = await import('./infra/storage')
        const vpc = new sst.aws.Vpc('SmultiVPC')
        new sst.aws.React('SmultiApp', {
            link: [storage],
            vpc,
            path: 'apps/web',
            environment: {
                DATABASE_URL: process.env.DATABASE_URL!,
            },
        })

        const processQueue = await import('./infra/process-queue')
        new sst.aws.Function('SQSProcessorFunction', {
            python: {
                container: true,
            },
            vpc,
            bundle: 'apps/process-worker',
            handler: 'services/process-worker/src/worker.handler',
            runtime: 'python3.11',
            link: [processQueue],
        })
    },
})
