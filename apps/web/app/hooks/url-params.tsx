import { startTransition } from 'react'
import { useNavigate, useParams } from 'react-router'

export function useUrlParams() {
    const navigate = useNavigate()
    const { language, requestId } = useParams()

    function changeLanguage(newLanguage: string) {
        if (!newLanguage) return
        startTransition(() => {
            navigate(`/${newLanguage}${requestId ? `/${requestId}` : ''}`, {
                replace: true,
            })
        })
    }

    function changeRequestId(newRequestId: string) {
        if (!newRequestId || !language) return
        startTransition(() => {
            navigate(`/${language}/${newRequestId}`, { replace: true })
        })
    }

    return {
        language,
        requestId,
        changeLanguage,
        changeRequestId,
    }
}
