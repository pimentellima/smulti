import { ApiError, handleApiError } from '@/common/errors'
import { getJobOrThrow, updateJobStatus } from '@/core/api'
import { z } from 'zod'
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

export async function loader({ params, request }: Route.LoaderArgs) {
    try {
        return await getJobOrThrow(z.string().uuid().parse(params.jobId))
    } catch (e) {
        return handleApiError(e)
    }
}
