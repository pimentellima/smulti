import { ApiError, handleApiError } from '@/common/errors'
import { z } from 'zod'
import {
    batchUpdateJobStatus,
    createJobs,
    createRequest,
    getItemsInQueueCount,
    getJobsByRequestId,
} from '@/core/api'
import type { Route } from './+types/jobs'
import { MAX_CONCURRENT_JOBS } from '@/common/constants'
import { addJobsToProcessQueue } from '@/core/aws/sqs'
import { createJobsSchema } from '@/common/zod/job'

export async function action({ request }: Route.ActionArgs) {
    try {
        if (request.method === 'POST') {
            const body = await request.json()
            const postJobsData = createJobsSchema.parse(body)
            const requestId =
                postJobsData.requestId ?? (await createRequest()).id
            const urls = postJobsData.urls
            const jobs = await createJobs(
                urls.map((url) => ({
                    url,
                    title: '-',
                    status: 'waiting-to-process',
                    requestId,
                })),
            )

            // todo: checa runningJobs por usuário
            const runningJobs = await getItemsInQueueCount()

            const jobsToProcess = jobs
                .slice(0, MAX_CONCURRENT_JOBS - runningJobs)
                .map((job) => job.id)

            await batchUpdateJobStatus(jobsToProcess, 'queued-processing')

            const result = await addJobsToProcessQueue(jobsToProcess)
            const erroredJobs = result
                .filter((r) => r.status === 'rejected')
                .map((r) => r.reason.id)
            await batchUpdateJobStatus(erroredJobs, 'error-processing')

            return { requestId }
        }
        throw new ApiError({
            code: 'bad_request',
            message: 'Method Not Allowed',
        })
    } catch (e) {
        console.log(e)
        return handleApiError(e)
    }
}
