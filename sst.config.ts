/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
    app(input) {
        return {
            name: 'smulti',
            removal: input?.stage === 'production' ? 'retain' : 'remove',
            protect: ['production'].includes(input?.stage),
            home: 'aws',
        }
    },
    async run() {
        const bucket = new sst.aws.Bucket('Bucket')
        new sst.aws.React('WebApp', {
            path: 'apps/web',
            link: [bucket],
            environment: {
                DATABASE_URL: process.env.DATABASE_URL,
            },
        })

        const processQueue = new sst.aws.Queue('ProcessQueue')
        new sst.aws.Function('ProcessWorker', {
            python: {
                container: true,
            },
            bundle: 'apps/process-worker',
            handler: 'apps/process-worker/src/worker.handler',
            runtime: 'python3.11',
            link: [processQueue],
        })
    },
})
