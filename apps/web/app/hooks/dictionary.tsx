import { loadDictionary } from '@/lib/dictionaries/load-dictionary'
import { useLocale } from './locale'

export default function useDictionary() {
    const locale = useLocale()
    return loadDictionary(locale)
}
