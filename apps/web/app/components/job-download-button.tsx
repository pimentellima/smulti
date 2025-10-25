import { Button } from '@/components/ui/button'
import { CircleAlert, DownloadIcon, Loader2Icon } from 'lucide-react'
import { useLocale } from '../hooks/locale'
import { useJobPoll } from '../hooks/poll'
import {
    isJobConverting,
    isJobConvertingError,
    isJobProcessing,
} from '@/common/utils'
import { useStartConversion } from '../hooks/jobs'

interface JobDownloadButtonProps {
    onStartPolling: () => void
    enablePolling: boolean
    jobId: string
    formatId: string
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
        converting: 'Converting',
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
        converting: 'Convertendo',
    },
}

export default function JobDownloadButton({
    jobId,
    formatId,
    onStartPolling,
    enablePolling,
}: JobDownloadButtonProps) {
    const { mutate } = useStartConversion()
    const locale = useLocale()
    const { data, isError } = useJobPoll(
        { formatId, jobId },
        {
            enablePolling: enablePolling,
            onDownloadReady: (downloadUrl) => {
                const link = document.createElement('a')
                link.target = '_blank'
                link.href = downloadUrl!
                link.click()
                link.remove()
            },
        },
    )
    console.log(enablePolling, data, isError)

    const hasError = isError || (data?.job && isJobConvertingError(data.job))

    const isProcessing = data ? isJobProcessing(data.job) : false
    const isConverting = data ? isJobConverting(data.job) : false

    const isLoading = isProcessing || isConverting
    const isDownloadReady = data?.downloadUrl

    const statusText = isProcessing
        ? dictionary[locale]['processing']
        : isConverting
          ? dictionary[locale]['converting']
          : ''

    if (isDownloadReady) {
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
                    href={data.downloadUrl}
                    className="contents"
                >
                    <DownloadIcon className="h-4 w-4" />
                </a>
            </Button>
        )
    }

    if (isLoading) {
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

    return (
        <Button
            size={'icon'}
            variant={hasError ? 'destructive' : 'outline'}
            title={
                hasError
                    ? dictionary[locale]['error-try-again']
                    : dictionary[locale].download
            }
            className="group relative"
            onClick={() => {
                mutate({ formatId, jobId })
                onStartPolling()
            }}
        >
            {hasError && (
                <CircleAlert className="absolute group-hover:opacity-0 transition-opacity h-4 w-4" />
            )}
            <DownloadIcon
                className={`absolute h-4 w-4 transition-opacity ${
                    hasError ? 'opacity-0 group-hover:opacity-100' : ''
                }`}
            />
        </Button>
    )
}
