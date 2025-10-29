import { handleApiError } from '@/common/errors'
import { getJobsByRequestId } from '@/core/api'
import { Route } from './+types/jobs.request.$requestId'

export async function loader({ request, params }: Route.ActionArgs) {
    try {
        return await getJobsByRequestId(params.requestId)
    } catch (e) {
        return handleApiError(e)
    }
}
