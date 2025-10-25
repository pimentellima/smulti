import type { Locale } from '@/common/locale'
import { Heart } from 'lucide-react'
import { Button } from './ui/button'

export function DonateButton({ locale }: { locale?: Locale }) {
    return (
        <Button variant={'secondary'} asChild>
            <a href={''} target="_blank">
                <Heart className="text-primary h-4 w-4 mr-2" />{' '}
                {locale === 'pt-BR' ? 'Apoie o projeto' : 'Support the project'}
            </a>
        </Button>
    )
}
