import { handleApiError } from '@/common/errors'
import {
    getDownloadByFormatId
} from '@/core/api'
import { z } from 'zod'
import { Route } from './+types/downloads.$formatId'

export async function loader({ request, params }: Route.ActionArgs) {
    try {
        const formatId = z.string().uuid().parse(params.formatId)
        return await getDownloadByFormatId(formatId)
    } catch (e) {
        return handleApiError(e)
    }
}
