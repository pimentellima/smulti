import {
    getFormatById,
    updateDownloadStatus,
    updateFormatDownloadUrl,
} from '@/core/api'
import { uploadFromStream } from '@/core/aws/s3'
import { SQSHandler } from 'aws-lambda'
import { spawn } from 'child_process'

async function downloadAndUpload(format: { id: string; url: string }) {
    const key = `videos/${format.id}.mp4`
    const downloadUrl = `https://${process.env.S3_UPLOADS_BUCKET_NAME}.s3.us-east-1.amazonaws.com/${key}`

    return new Promise<string>((resolve, reject) => {
        const ffmpeg = spawn('/opt/bin/ffmpeg', [
            '-i',
            format.url,
            '-c',
            'copy',
            '-f',
            'mpegts',
            'pipe:1',
        ])
        let stderr = ''
        ffmpeg.stderr.on('data', (data) => {
            console.log(data.toString())
            stderr += data.toString()
        })
        ffmpeg.on('error', (err) => reject(err))
        uploadFromStream(key, ffmpeg.stdout)
            .then(() => resolve(downloadUrl))
            .catch((err) => reject(err))
    })
}

export const handler: SQSHandler = async (event) => {
    for (const record of event.Records) {
        const formatId = record.body
        try {
            console.log('Processando formatId:', formatId)

            const { id, url } = await getFormatById(formatId)
            await updateDownloadStatus(formatId, 'downloading')
            const downloadUrl = await downloadAndUpload({ id, url })
            const { downloadStatus } = await getFormatById(formatId)
            if (downloadStatus === 'cancelled') {
                console.log('Download cancelled for formatId:', formatId)
                continue
            }
            await updateDownloadStatus(formatId, 'finished-downloading')
            await updateFormatDownloadUrl(formatId, downloadUrl)

            console.log('Processado formatId:', formatId, '->', downloadUrl)
        } catch (err) {
            await updateDownloadStatus(formatId, 'error-downloading')
            console.error('Erro processando mensagem:', formatId, err)
        }
    }
}
