import type { Locale } from '@/common/locale'
import { dictionary as enUS } from './en-US'
import { dictionary as ptBR } from './pt-BR'

export const loadDictionary = (locale: Locale) => {
    switch (locale) {
        case 'en-US':
            return enUS
        case 'pt-BR':
            return ptBR
        default:
            return enUS
    }
}
