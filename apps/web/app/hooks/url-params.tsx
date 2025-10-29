import { startTransition, useTransition } from 'react'
import { useLocation, useParams } from 'react-router'
import { useNavigate } from 'react-router'

export function useUrlParams() {
    const navigate = useNavigate()
    const { language, requestId } = useParams()
    const location = useLocation()

    // 🧠 Mantém query params ao navegar
    const search = location.search

    function changeLanguage(newLanguage: string) {
        if (!newLanguage || !requestId) return
        startTransition(() => {
            navigate(`/${newLanguage}/${requestId}${search}`, { replace: true })
        })
    }

    function changeRequestId(newRequestId: string) {
        if (!newRequestId || !language) return
        startTransition(() => {
            navigate(`/${language}/${newRequestId}${search}`, { replace: true })
        })
    }

    return {
        language,
        requestId,
        changeLanguage,
        changeRequestId,
    }
}
