import { S3 } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import Stream from 'stream'

const s3 = new S3({})
const Bucket = process.env.S3_UPLOADS_BUCKET_NAME!

export async function uploadFromStream(key: string, stream: Stream.Readable) {
    const upload = new Upload({
        client: s3,
        params: {
            Bucket,
            Key: key,
            Body: stream,
        },
    })
    return await upload.done()
}
