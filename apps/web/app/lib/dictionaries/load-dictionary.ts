import type { Locale } from '@/common/locale'
type DictionaryType = typeof import('./en-US').dictionary
const dictionaries = {
    'en-US': () => import('./en-US').then((module) => module.dictionary),
    'pt-BR': () => import('./pt-BR').then((module) => module.dictionary),
}

export const loadDictionary = (locale?: Locale): Promise<DictionaryType> => {
    if (!locale || !dictionaries[locale]) {
        return dictionaries['pt-BR']()
    }
    return dictionaries[locale]()
}
