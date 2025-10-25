import { useLocale } from '../hooks/locale'
import { DownloadIcon } from 'lucide-react'
import { type ComponentProps } from 'react'
import { Button } from './ui/button'

interface DownloadButtonProps {
    disabled?: boolean
    size?: ComponentProps<typeof Button>['size']
    variant?: ComponentProps<typeof Button>['variant']
    description?: string
    downloadLink?: string
}

const dictionary = {
    'en-US': {
        download: 'Download',
        error: 'An error occurred while downloading. Please try again.',
    },
    'pt-BR': {
        download: 'Baixar',
        error: 'Ocorreu um erro ao baixar. Por favor, tente novamente.',
    },
}

export default function DownloadButton({
    disabled,
    size,
    variant,
    description,
    downloadLink,
}: DownloadButtonProps) {
    const locale = useLocale()

    return disabled ? (
        <Button disabled size={size} variant={variant}>
            <DownloadIcon className="h-4 w-4" />
            {!!description && <p className=" ml-1">{description}</p>}
        </Button>
    ) : (
        <Button
            title={dictionary[locale].download}
            size={size}
            variant={variant}
            asChild
        >
            <a download={true} href={downloadLink} className="contents">
                <DownloadIcon className="h-4 w-4" />
                {!!description && <p className=" ml-1">{description}</p>}
            </a>
        </Button>
    )
}
