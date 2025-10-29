import { ApiError, handleApiError } from '@/common/errors'
import { getJobOrThrow, updateJobStatus } from '@/core/api'
import { z } from 'zod'
import { Route } from './+types/jobs.$jobId.cancel'

export async function action({ params, request }: Route.ActionArgs) {
    try {
        return await updateJobStatus(params.jobId, 'cancelled')
    } catch (e) {
        return handleApiError(e)
    }
}
