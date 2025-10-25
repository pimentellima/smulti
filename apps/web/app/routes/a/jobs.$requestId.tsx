import { ApiError, handleApiError } from '@/common/errors'
import { z } from 'zod'
import { getJobsByRequestId } from '@/core/api'

export async function action({ request, params }: any) {
    try {
        if (request.method === 'GET') {
            const requestId = z.string().uuid().parse(params.requestId)
            return await getJobsByRequestId(requestId)
        }
        throw new ApiError({
            code: 'bad_request',
            message: 'Method Not Allowed',
        })
    } catch (e) {
        handleApiError(e)
    }
}
