import { Button } from '@/components/ui/button'
import { CircleAlert, DownloadIcon, FileXIcon, Loader2Icon } from 'lucide-react'
import { useLocale } from '../hooks/locale'

interface JobDownloadButtonProps {
    isFormatSelected: boolean
    isProcessing: boolean
    downloadUrl: string | null
    isError: boolean
    onClickRetry: () => void
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
        error: 'Erro',
        cancelled: 'Cancelado',
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
    isProcessing,
    downloadUrl,
    isError,
    onClickRetry,
}: JobDownloadButtonProps) {
    const locale = useLocale()
    const statusText = isProcessing ? dictionary[locale]['processing'] : ''

    if (!isFormatSelected) {
        return (
            <Button
                title={dictionary[locale].selectFormat}
                size={'icon'}
                variant={'outline'}
                disabled
                asChild
            >
                <DownloadIcon className="h-4 w-4" />
            </Button>
        )
    }

    if (isError)
        return (
            <Button
                size={'icon'}
                variant={'destructive'}
                title={dictionary[locale]['error-try-again']}
                className="group relative"
                onClick={onClickRetry}
            >
                <CircleAlert className="absolute group-hover:opacity-0 transition-opacity h-4 w-4" />

                <DownloadIcon
                    className={`absolute h-4 w-4 transition-opacity opacity-0 group-hover:opacity-100`}
                />
            </Button>
        )

    if (isProcessing) {
        return (
            <Button
                disabled
                size={statusText ? 'default' : 'icon'}
                variant={'outline'}
                title={statusText}
            >
                {statusText && <span className="mr-2">{statusText}</span>}
                <Loader2Icon className="h-4 w-4 animate-spin" />
            </Button>
        )
    }

    if (downloadUrl) {
        return (
            <Button
                title={dictionary[locale].download}
                size={'icon'}
                variant={'outline'}
                asChild
            >
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

    return (
        <Button
            title={dictionary[locale].unsupportedFormat}
            size={'icon'}
            variant={'outline'}
            disabled
            asChild
        >
            <FileXIcon className="h-4 w-4" />
        </Button>
    )
}
