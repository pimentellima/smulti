import { ApiError, handleApiError } from '@/common/errors'
import { z } from 'zod'
import { getJobsByRequestId } from '@/core/api'

export async function loader({ request, params }: any) {
    try {
        const requestId = z.string().uuid().parse(params.requestId)
        return await getJobsByRequestId(requestId)
    } catch (e) {
        return handleApiError(e)
    }
}
