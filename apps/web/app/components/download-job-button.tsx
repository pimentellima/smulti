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
        'error-try-again':
            'An error occurred while downloading. Please try again.',
        error: 'Error',
        cancelled: 'Cancelled',
        'queued-processing': 'Queued',
        processing: 'Processing',
        'finished-processing': 'Processed',
        ready: 'Ready',
        'queued-converting': 'Queued',
        selectFormat: 'Select a format from the list',
        unsupportedFormat: 'Unsupported format',
    },
    'pt-BR': {
        download: 'Baixar',
        'error-try-again':
            'Ocorreu um erro ao baixar. Por favor, tente novamente.',
        'queued-processing': 'Na fila',
        processing: 'Processando',
        'finished-processing': 'Processado',
        ready: 'Pronto',
        'queued-converting': 'Na fila',
        selectFormat: 'Selecione um formato da lista',
        unsupportedFormat: 'Formato não Suportado',
    },
}

export default function DownloadJobButton({
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
