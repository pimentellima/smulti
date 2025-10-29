import {
    GetQueueUrlCommand,
    SQSClient,
    SendMessageBatchCommand
} from '@aws-sdk/client-sqs'

const client = new SQSClient({})

export async function addJobsToProcessQueue(jobIds: string[]) {
    const { QueueUrl } = await client.send(
        new GetQueueUrlCommand({
            QueueName: process.env.SQS_PROCESS_QUEUE_NAME!,
        }),
    )

    return await client.send(
        new SendMessageBatchCommand({
            QueueUrl,
            Entries: jobIds.map((id) => ({
                MessageBody: id,
                Id: id,
            })),
        }),
    )
}

export async function addFormatsToDownloadQueue(formatIds: string[]) {
    const { QueueUrl } = await client.send(
        new GetQueueUrlCommand({
            QueueName: process.env.SQS_DOWNLOAD_QUEUE_NAME!,
        }),
    )

    return await client.send(
        new SendMessageBatchCommand({
            QueueUrl,
            Entries: formatIds.map((id) => ({
                MessageBody: id,
                Id: id,
            })),
        }),
    )
}
