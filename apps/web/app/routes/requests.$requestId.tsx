import { handleApiError } from '@/common/errors'
import { getJobsByRequestId } from '@/core/api'
import { z } from 'zod'
import { Route } from './+types/requests.$requestId'

export async function loader({ request, params }: Route.ActionArgs) {
    try {
        const requestId = z.string().uuid().parse(params.requestId)
        return await getJobsByRequestId(requestId)
    } catch (e) {
        return handleApiError(e)
    }
}
