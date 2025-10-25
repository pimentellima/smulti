import {
    getItemsInQueueCount,
    getJob,
    getMergedVideoByFormatId,
    updateMergedFormatStatus,
    upsertMergedFormat,
} from '@/core/api'
import { addMergedFormatToConvertQueue } from '@/core/aws/sqs'
import { ApiError, handleApiError } from '@/common/errors'
import { matchAudioFormatForVideo } from '@/common/sort-audio-formats'
import { MAX_CONCURRENT_JOBS } from '@/common/constants'
import { jobFormatSchema } from '@/common/zod/job'

export async function action({ params, request }: any) {
    try {
        if (request.method === 'POST') {
            const { formatId, jobId } = jobFormatSchema.parse({
                jobId: params.jobId,
                formatId: params.formatId,
            })
            const job = await getJob(jobId)
            const format = job.formats?.find((f) => f.id === formatId)

            if (!format) {
                throw new ApiError({
                    code: 'not_found',
                    message: `Format with id ${formatId} not found for job ${jobId}`,
                })
            }

            if (job.status !== 'finished-processing') {
                throw new ApiError({
                    code: 'unprocessable_entity',
                    message: `Job ${jobId} is not finished processing`,
                })
            }

            // todo: checa quantos jobs o usuário pode adicionar na fila
            const audioFormat = matchAudioFormatForVideo(format, job.formats)
            const insertedMergedFormat = await upsertMergedFormat(
                jobId,
                'waiting-to-convert',
                formatId,
                audioFormat.id,
            )
            const totalItemsInQueue = await getItemsInQueueCount()
            if (
                insertedMergedFormat &&
                totalItemsInQueue < MAX_CONCURRENT_JOBS
            ) {
                try {
                    await updateMergedFormatStatus(
                        insertedMergedFormat.id,
                        'queued-converting',
                    )
                    await addMergedFormatToConvertQueue(insertedMergedFormat.id)
                } catch (e) {
                    await updateMergedFormatStatus(jobId, 'waiting-to-convert')
                    throw e
                }
            }

            return { ok: true }
        }
        if (request.method === 'GET') {
            const { formatId, jobId } = jobFormatSchema.parse({
                jobId: params.jobId,
                formatId: params.formatId,
            })
            const job = await getJob(jobId)
            const format = job.formats?.find((f) => f.id === formatId)

            if (!format) {
                throw new ApiError({
                    code: 'not_found',
                    message: `Format with id ${formatId} not found for job ${jobId}`,
                })
            }

            let downloadUrl: string | undefined

            if (format.acodec !== 'none') {
                downloadUrl = format.url
            } else {
                const mergedVideo = await getMergedVideoByFormatId(formatId)
                if (mergedVideo?.downloadUrl) {
                    downloadUrl = mergedVideo.downloadUrl
                }
            }
            return {
                job,
                downloadUrl,
            }
        }

        throw new ApiError({
            code: 'bad_request',
            message: `Method ${request.method} not allowed`,
        })
    } catch (e) {
        return handleApiError(e)
    }
}
