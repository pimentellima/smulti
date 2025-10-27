import { ApiError, handleApiError } from '@/common/errors'
import {
    getItemsInQueueCount,
    getJobOrThrow,
    updateJobStatus,
} from '@/core/api'
import { Route } from './+types/jobs.retry.$jobId'
import { CONCURRENT_JOB_LIMIT } from '@/common/constants'
import { addJobsToProcessQueue } from '@/core/aws/sqs'

export async function action({ request, params }: Route.ActionArgs) {
    try {
        if (request.method === 'POST') {
            const job = await getJobOrThrow(params.jobId)
            const itemsInQueue = await getItemsInQueueCount()
            if (itemsInQueue >= CONCURRENT_JOB_LIMIT) {
                throw new ApiError({
                    code: 'exceeded_limit',
                    message: 'Job queue is full, please try again later',
                })
            }

            await updateJobStatus(job.id, 'queued-processing')
            await addJobsToProcessQueue([job.id])
        }
        throw new ApiError({
            code: 'bad_request',
            message: 'Method Not Allowed',
        })
    } catch (e) {
        return handleApiError(e)
    }
}
