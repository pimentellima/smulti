import { Format, JobWithFormats } from '@/common/types'
import {
    getJobDownloadUrl,
    isJobProcessing,
    isJobProcessingError,
} from '@/common/utils'
import { useRetryJob } from '@/hooks/jobs'
import { useLocale } from '@/hooks/locale'
import { LoaderCircle, XIcon } from 'lucide-react'
import { useState } from 'react'
import CancelJobButton from './cancel-job-button'
import DownloadButton from './download-button'
import FormatSelector from './format-selector'
import { Button } from './ui/button'

const dictionary = {
    'en-US': {
        processing: 'Processing',
        'try-again': 'Try Again',
    },
    'pt-BR': {
        processing: 'Processando',
        'try-again': 'Tentar novamente',
    },
}

export default function JobActions({
    job,
}: {
    job: JobWithFormats
}) {
    const locale = useLocale()
    const [selectedFormat, setSelectedFormat] = useState<Format | null>(null)
    const formatId = selectedFormat?.id
    const jobId = job.id
    const { mutate: retryJob } = useRetryJob(job.id)
    const isProcessing = isJobProcessing(job?.status)
    const downloadUrl = getJobDownloadUrl(job, formatId)
    const isError = isJobProcessingError(job?.status)

    return (
        <div className="flex gap-1 w-min">
            {isProcessing ? (
                <Button
                    disabled
                    variant="outline"
                    className="justify-between w-min sm:w-44"
                >
                    <span className="hidden sm:flex items-center gap-2">
                        {dictionary[locale]['processing']}
                    </span>
                    <LoaderCircle className="animate-spin" />
                </Button>
            ) : isError ? (
                <Button
                    onClick={() => retryJob()}
                    variant="destructive"
                    className="justify-start w-min sm:w-44 "
                >
                    <XIcon />
                    <span className="hidden sm:flex items-center gap-2">
                        {dictionary[locale]['try-again']}
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
            <DownloadButton
                isFormatSelected={!!formatId}
                downloadUrl={downloadUrl}
            />
            <CancelJobButton jobId={jobId} />
        </div>
    )
}
