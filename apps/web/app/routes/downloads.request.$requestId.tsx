import { handleApiError } from '@/common/errors'
import { getDownloadsByRequestId } from '@/core/api'
import { z } from 'zod'
import { Route } from './+types/downloads.request.$requestId'

export async function loader({ request, params }: Route.ActionArgs) {
    try {
        const requestId = z.string().uuid().parse(params.requestId)
        return await getDownloadsByRequestId(requestId)
    } catch (e) {
        return handleApiError(e)
    }
}
