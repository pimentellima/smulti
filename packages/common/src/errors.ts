import z, { ZodError } from 'zod'
import { generateErrorMessage } from 'zod-error'

export const ErrorCode = z.enum([
    'bad_request',
    'not_found',
    'internal_server_error',
    'unauthorized',
    'forbidden',
    'rate_limit_exceeded',
    'invite_expired',
    'invite_pending',
    'exceeded_limit',
    'conflict',
    'unprocessable_entity',
])

const errorCodeToHttpStatus: Record<z.infer<typeof ErrorCode>, number> = {
    bad_request: 400,
    unauthorized: 401,
    forbidden: 403,
    exceeded_limit: 403,
    not_found: 404,
    conflict: 409,
    invite_pending: 409,
    invite_expired: 410,
    unprocessable_entity: 422,
    rate_limit_exceeded: 429,
    internal_server_error: 500,
}

export const httpStatusToErrorCode = Object.fromEntries(
    Object.entries(errorCodeToHttpStatus).map(([code, status]) => [
        status,
        code,
    ])
) as Record<number, z.infer<typeof ErrorCode>>

const ErrorResponseSchema = z.object({
    error: z.object({
        code: ErrorCode,
        message: z.string(),
    }),
})

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>
export type ErrorCodes = z.infer<typeof ErrorCode>

export class ApiError extends Error {
    public readonly code: z.infer<typeof ErrorCode>
    public readonly docUrl?: string

    constructor({
        code,
        message,
    }: {
        code: z.infer<typeof ErrorCode>
        message: string
    }) {
        super(message)
        this.code = code
    }
}

export function fromZodError(error: ZodError): ErrorResponse {
    return {
        error: {
            code: 'unprocessable_entity',
            message: generateErrorMessage(error.issues, {
                maxErrors: 1,
                delimiter: {
                    component: ': ',
                },
                path: {
                    enabled: true,
                    type: 'objectNotation',
                    label: '',
                },
                code: {
                    enabled: true,
                    label: '',
                },
                message: {
                    enabled: true,
                    label: '',
                },
            }),
        },
    }
}

export function handleApiError(error: any): ErrorResponse & { status: number } {
    // Zod error
    if (error instanceof ZodError) {
        return {
            ...fromZodError(error),
            status: errorCodeToHttpStatus.unprocessable_entity,
        }
    }

    // Api error
    if (error instanceof ApiError) {
        return {
            error: {
                code: error.code,
                message: error.message,
            },
            status: errorCodeToHttpStatus[error.code],
        }
    }

    return {
        error: {
            code: 'internal_server_error',
            message: 'An internal server error occurred.',
        },
        status: 500,
    }
}
