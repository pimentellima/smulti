import { ApiError, handleApiError } from '@/common/errors'
import { getFormatById, updateDownloadStatus } from '@/core/api'
import { Route } from './+types/downloads.$formatId.cancel'
import { addFormatsToDownloadQueue } from '@/core/aws/sqs'

export async function action({ params, request }: Route.ActionArgs) {
    try {
        const format = await getFormatById(params.formatId)
        if (format.downloadUrl) {
            throw new ApiError({
                code: 'bad_request',
                message: 'Download URL already exists for this format.',
            })
        }

        await updateDownloadStatus(params.formatId, 'queued-downloading')
        const result = await addFormatsToDownloadQueue([params.formatId])
        if (result.Failed?.length) {
            return await updateDownloadStatus(
                params.formatId,
                'error-downloading',
            )
        }
        return format
    } catch (e) {
        return handleApiError(e)
    }
}
