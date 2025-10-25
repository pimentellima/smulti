import { ApiError } from '@/common/errors'
import {
    SQSClient,
    SendMessageBatchCommand,
    SendMessageCommand,
} from '@aws-sdk/client-sqs'
import { Resource } from 'sst'

const client = new SQSClient({})

export async function addJobsToProcessQueue(jobIds: string[]) {
    // const ProcessQueueUrl = Resource.ProcessQueue.url
    const ProcessQueueUrl = ''
    try {
        return await client.send(
            new SendMessageBatchCommand({
                QueueUrl: ProcessQueueUrl,
                Entries: jobIds.map((id) => ({
                    MessageBody: id,
                    Id: id,
                })),
            }),
        )
    } catch (error) {
        throw new ApiError({
            code: 'internal_server_error',
            message: 'Error sending messages to SQS Process Queue',
        })
    }
}

export async function addMergedFormatToConvertQueue(mergedFormatId: string) {
    // const PrepareQueueUrl = Resource.PrepareConversionQueue.url
    const PrepareQueueUrl = ''

    try {
        const command = new SendMessageCommand({
            QueueUrl: PrepareQueueUrl,
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
