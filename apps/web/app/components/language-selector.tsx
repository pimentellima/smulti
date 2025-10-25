import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLocale } from '../hooks/locale'
import type { Locale } from '@/common/locale'
import { cn } from '../lib/utils'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useState, useTransition } from 'react'
import { useNavigate } from 'react-router'

interface LanguageSelectorProps {
    locale?: Locale
}

const languages = [
    { label: 'en-US', value: 'en-US' },
    { label: 'pt-BR', value: 'pt-BR' },
]

export function LanguageSelector() {
    const locale = useLocale()
    const navigate = useNavigate()
    const [isPending, startTransition] = useTransition()
    const [open, setOpen] = useState(false)

    const onSelectLanguage = (locale: string) => {
        startTransition(() => {
            const params = new URLSearchParams(window.location.search)
            params.set('locale', locale)
            navigate(`?${params.toString()}`)
        })
        setOpen(false)
    }

    const currentLanguage =
        languages.find((l) => l.value === locale) || languages[0]

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="justify-between">
                    {currentLanguage?.label}
                    <ChevronsUpDown className="ml-auto h-4 w-4 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {languages.map((language) => (
                    <DropdownMenuItem
                        key={language.value}
                        onClick={() => onSelectLanguage(language.value)}
                        className={cn(
                            'cursor-pointer',
                            locale === language.value && 'font-medium',
                        )}
                        disabled={isPending}
                    >
                        {locale === language.value && (
                            <Check className="mr-2 h-4 w-4" />
                        )}
                        {language.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
