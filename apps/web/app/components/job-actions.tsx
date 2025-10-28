import { Format } from '@/common/types'
import {
    getJobDownloadUrl,
    isJobProcessing,
    isJobProcessingError,
} from '@/common/utils'
import { useRetryJob } from '@/hooks/jobs'
import { useLocale } from '@/hooks/locale'
import { useRealtimeJob } from '@/hooks/realtime-job'
import { XIcon } from 'lucide-react'
import { useState } from 'react'
import CancelJobButton from './cancel-job-button'
import DownloadJobButton from './download-job-button'
import FormatSelector from './format-selector'
import { Button } from './ui/button'

const dictionary = {
    'en-US': {
        processing: 'Processing...',
        'error-processing': 'Error processing',
    },
    'pt-BR': {
        processing: 'Processando...',
        'error-processing': 'Erro ao processar',
    },
}

export default function JobActions({ jobId }: { jobId: string }) {
    const locale = useLocale()
    const [selectedFormat, setSelectedFormat] = useState<Format | null>(null)
    const formatId = selectedFormat?.id
    const { data: job } = useRealtimeJob(jobId)

    const { mutate: retryProcessing } = useRetryJob()

    const isProcessing = isJobProcessing(job?.status)
    const downloadUrl = getJobDownloadUrl(job, formatId)
    const isError = isJobProcessingError(job?.status)

    return (
        <div className="flex gap-1 w-min">
            {isProcessing ? (
                <Button
                    disabled
                    variant="outline"
                    className="justify-between w-min"
                >
                    <span className="hidden sm:flex items-center gap-2">
                        {dictionary[locale]['processing']}
                    </span>
                </Button>
            ) : isError ? (
                <Button
                    disabled
                    variant="destructive"
                    className="justify-start w-min sm:w-48"
                >
                    <XIcon />
                    <span className="hidden sm:flex items-center gap-2">
                        {dictionary[locale]['error-processing']}
                    </span>
                </Button>
            ) : (
                <FormatSelector
                    formats={job?.formats}
                    selectedFormat={selectedFormat}
                    disabled={job?.formats.length === 0 || isProcessing}
                    isLoadingFormats={isProcessing}
                    onSelect={(format) => setSelectedFormat(format)}
                />
            )}
            <DownloadJobButton
                isFormatSelected={!!formatId}
                onClickRetry={() => retryProcessing(jobId)}
                isProcessing={isProcessing ?? false}
                isError={isError ?? false}
                downloadUrl={downloadUrl}
            />
            <CancelJobButton jobId={jobId} />
        </div>
    )
}
