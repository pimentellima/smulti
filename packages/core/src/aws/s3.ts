import {
    S3Client
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { Resource } from 'sst'
import { PassThrough } from 'stream'

const client = new S3Client({})

export async function uploadFromStream(key: string, pass: PassThrough) {
    // const bucket = Resource.MyBucket.name
    const bucket = ''
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
