import { S3, S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { PassThrough } from 'stream'

const client = new S3({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
})

export async function uploadFromStream(key: string, pass: PassThrough) {
    const bucket = process.env.S3_UPLOADS_BUCKET_NAME!
    const upload = new Upload({
        client,
        params: {
            Bucket: bucket,
            Key: key,
            Body: pass,
        },
    })
    return await upload.done()
}
