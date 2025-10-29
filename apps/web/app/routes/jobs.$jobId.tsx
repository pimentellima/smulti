import { handleApiError } from '@/common/errors'
import { getJobOrThrow } from '@/core/api'
import { z } from 'zod'
import { Route } from './+types/jobs.$jobId'

export async function loader({ params, request }: Route.LoaderArgs) {
    try {
        return await getJobOrThrow(z.string().uuid().parse(params.jobId))
    } catch (e) {
        return handleApiError(e)
    }
}
