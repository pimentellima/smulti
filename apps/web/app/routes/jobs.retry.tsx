import { retryJobsByIds, retryJobsByRequestId } from '@/core/api'
import { ApiError, handleApiError } from '@/common/errors'
import { retryJobsSchema } from '@/common/zod/job'

export async function action({ request, params }: any) {
    try {
        if (request.method === 'POST') {
            const { ids, requestId } = retryJobsSchema.parse(request.body)

            if (ids) {
                await retryJobsByIds(ids)
            } else {
                await retryJobsByRequestId(requestId!)
            }
        }
        throw new ApiError({
            code: 'bad_request',
            message: 'Method Not Allowed',
        })
    } catch (e) {
        return handleApiError(e)
    }
}
