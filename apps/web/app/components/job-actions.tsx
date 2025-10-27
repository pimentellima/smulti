import { Format, JobWithFormats } from '@/common/types'
import {
    getJobDownloadUrl,
    isJobProcessing,
    isJobProcessingError,
} from '@/common/utils'
import { useRealtimeJob } from '@/hooks/realtime-job'
import { useRetryJob } from '@/hooks/jobs'
import { useLocale } from '@/hooks/locale'
import { useState } from 'react'
import CancelJobButton from './cancel-job-button'
import DownloadJobButton from './download-job-button'
import FormatSelector from './format-selector'
import { Button } from './ui/button'
import { XIcon } from 'lucide-react'

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

export default function JobActions({ job }: { job: JobWithFormats }) {
    const locale = useLocale()
    const [selectedFormat, setSelectedFormat] = useState<Format | null>(null)
    const formatId = selectedFormat?.id
    const { data: realtimeJob } = useRealtimeJob(job.id)

    const { mutate: retryProcessing } = useRetryJob()

    const isProcessing = isJobProcessing(realtimeJob?.status)
    const downloadUrl = getJobDownloadUrl(job, formatId)
    const isError = isJobProcessingError(realtimeJob?.status)

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
                    formats={job.formats}
                    selectedFormat={selectedFormat}
                    disabled={job.formats.length === 0 || isProcessing}
                    isLoadingFormats={isProcessing}
                    onSelect={(format) => setSelectedFormat(format)}
                />
            )}
            <DownloadJobButton
                isFormatSelected={!!formatId}
                onClickRetry={() => retryProcessing(job.id)}
                isProcessing={isProcessing ?? false}
                isError={isError ?? false}
                downloadUrl={downloadUrl}
            />
            <CancelJobButton jobId={job.id} />
        </div>
    )
}
