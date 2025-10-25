import { localeValidation, type Locale } from '@/common/locale'
import { useParams } from 'react-router'

export function useLocale() {
    const params = useParams()
    const locale = localeValidation.safeParse(params.language)
    return (locale.success ? locale.data : 'pt-BR') as Locale
}
