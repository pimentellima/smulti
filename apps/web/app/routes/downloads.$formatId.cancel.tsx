import { handleApiError } from '@/common/errors'
import { updateDownloadStatus } from '@/core/api'
import { Route } from './+types/downloads.$formatId.cancel'

export async function action({ params, request }: Route.ActionArgs) {
    try {
        return await updateDownloadStatus(params.formatId, null)
    } catch (e) {
        return handleApiError(e)
    }
}
