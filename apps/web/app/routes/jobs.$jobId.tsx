import { ApiError, handleApiError } from '@/common/errors'
import {
    updateJobStatus
} from '@/core/api'
import { Route } from './+types/jobs.$jobId'

export async function action({ params, request }: Route.ActionArgs) {
    try {
        if (request.method === 'PUT') {
            return await updateJobStatus(params.jobId, 'cancelled')
        }

        throw new ApiError({
            code: 'bad_request',
            message: `Method ${request.method} not allowed`,
        })
    } catch (e) {
        return handleApiError(e)
    }
}
