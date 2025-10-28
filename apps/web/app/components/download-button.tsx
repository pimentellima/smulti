import { Button } from '@/components/ui/button'
import { DownloadIcon } from 'lucide-react'
import { useLocale } from '../hooks/locale'

interface JobDownloadButtonProps {
    isFormatSelected: boolean
    downloadUrl: string | null
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
    isFormatSelected,
    downloadUrl,
}: JobDownloadButtonProps) {
    const locale = useLocale()

    if (!isFormatSelected || !downloadUrl)
        return (
            <Button variant={'outline'} disabled>
                <DownloadIcon className="h-4 w-4" />
            </Button>
        )

    return (
        <Button title={dictionary[locale].download} variant={'outline'} asChild>
            <a
                download={true}
                target="_blank"
                href={downloadUrl}
                className="contents"
            >
                <DownloadIcon className="h-4 w-4" />
            </a>
        </Button>
    )
}
