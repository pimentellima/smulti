import { CONCURRENT_JOB_LIMIT } from '@/common/constants'
import {
    batchUpdateJobStatus,
    findJobsWaitingToProcess,
    getItemsInQueueCount,
} from '@/core/api'
import { addJobsToProcessQueue } from '@/core/index'
import { Handler } from 'aws-lambda'

export const handler: Handler = async () => {
    try {
        // todo: checar jobs em queue por usuário
        const itemsInQueue = await getItemsInQueueCount()
        const jobsToEnque = (await findJobsWaitingToProcess())
            .slice(0, CONCURRENT_JOB_LIMIT - itemsInQueue)
            .filter((job) => job.jobStatus === 'waiting-to-process')
            .map((job) => job.jobId)

        await batchUpdateJobStatus(jobsToEnque, 'queued-processing')
        const result = await addJobsToProcessQueue(jobsToEnque)
        const erroredJobIds =
            result.Failed?.map((res) => res.Id).filter(
                (id): id is string => !!id,
            ) || []

        await batchUpdateJobStatus(erroredJobIds, 'error-processing')

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Sucesso' }),
        }
    } catch (err) {
        console.error('Erro no handler:', err)
        throw err
    }
}
