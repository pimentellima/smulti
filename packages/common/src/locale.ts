import Negotiator from 'negotiator'
import { match } from '@formatjs/intl-localematcher'
import { z } from 'zod'

export const locales = ['en-US', 'pt-BR'] as const
export const localeValidation = z.enum(locales)
export type Locale = z.infer<typeof localeValidation>

export function getLocale(headers: any): Locale {
    const languages = new Negotiator({ headers }).languages()
    return match(languages, locales, 'pt-BR') as Locale
}
