import { Button } from '@/components/ui/button'
import { DownloadIcon, Loader2Icon } from 'lucide-react'
import { useLocale } from '../hooks/locale'

interface JobDownloadButtonProps {
    isDisabled?: boolean
    isPending?: boolean
    onClickDownload: () => void
}

const dictionary = {
    'en-US': {
        download: 'Download',
    },
    'pt-BR': {
        download: 'Baixar',
    },
}

export default function DownloadButton({
    isDisabled,
    isPending,
    onClickDownload,
}: JobDownloadButtonProps) {
    const locale = useLocale()

    if (isPending)
        return (
            <Button variant={'outline'} disabled>
                <Loader2Icon className="animate-spin" />
            </Button>
        )

    if (isDisabled)
        return (
            <Button variant={'outline'} disabled>
                <DownloadIcon className="h-4 w-4" />
            </Button>
        )

    return (
        <Button
            title={dictionary[locale].download}
            variant={'outline'}
            onClick={onClickDownload}
        >
            <DownloadIcon className="h-4 w-4" />
        </Button>
    )
}
