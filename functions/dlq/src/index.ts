import { updateJobStatus } from '@/core/api'
import { SQSHandler } from 'aws-lambda'

export const handler: SQSHandler = async (event) => {
    for (const record of event.Records) {
        const jobId = record.body as string
        await updateJobStatus(jobId, 'error-processing')
        console.log(`Job ${jobId} marcado como erro (DLQ)`)
    }
}
