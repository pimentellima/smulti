import { ApiError } from '@/common/errors'
import {
    GetQueueUrlCommand,
    SQSClient,
    SendMessageBatchCommand,
    SendMessageCommand,
} from '@aws-sdk/client-sqs'

const client = new SQSClient({})

export async function addJobsToProcessQueue(jobIds: string[]) {
    const { QueueUrl } = await client.send(
        new GetQueueUrlCommand({
            QueueName: process.env.SQS_PROCESS_QUEUE_NAME!,
        }),
    )
    return await Promise.allSettled(
        jobIds.map(async (id) => {
            return new Promise<{ id: string }>(async (resolve, reject) => {
                try {
                    await client.send(
                        new SendMessageBatchCommand({
                            QueueUrl,
                            Entries: jobIds.map((id) => ({
                                MessageBody: id,
                                Id: id,
                            })),
                        }),
                    )
                    return resolve({ id })
                } catch (error) {
                    return reject({ id })
                }
            })
        }),
    )
}

export async function addMergedFormatToConvertQueue(mergedFormatId: string) {
    const { QueueUrl } = await client.send(
        new GetQueueUrlCommand({
            QueueName: process.env.SQS_CONVERT_QUEUE_NAME!,
        }),
    )
    try {
        const command = new SendMessageCommand({
            QueueUrl,
            MessageBody: mergedFormatId,
        })
        return await client.send(command)
    } catch (error) {
        throw new ApiError({
            code: 'internal_server_error',
            message: 'Error sending message to SQS Convert Queue',
        })
    }
}
