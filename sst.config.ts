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

        new sst.aws.React('SmultiApp', {
            link: [storage],
            path: 'apps/web',
            environment: {
                DATABASE_URL: process.env.DATABASE_URL!,
            },
        })
    },
})
