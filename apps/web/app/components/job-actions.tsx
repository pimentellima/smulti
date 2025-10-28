import { Format, JobWithFormats } from '@/common/types'
import {
    getJobDownloadUrl,
    isJobProcessing,
    isJobProcessingError,
} from '@/common/utils'
import { useJob, useRetryJob } from '@/hooks/jobs'
import { useLocale } from '@/hooks/locale'
import { LoaderCircle, XIcon } from 'lucide-react'
import { useState } from 'react'
import CancelJobButton from './cancel-job-button'
import DownloadJobButton from './download-job-button'
import FormatSelector from './format-selector'
import { Button } from './ui/button'

const dictionary = {
    'en-US': {
        processing: 'Processing...',
        'try-again': 'Try Again',
    },
    'pt-BR': {
        processing: 'Processando...',
        'try-again': 'Tentar novamente',
    },
}

export default function JobActions({
    initialJobData,
}: {
    initialJobData: JobWithFormats
}) {
    const locale = useLocale()
    const [selectedFormat, setSelectedFormat] = useState<Format | null>(null)
    const formatId = selectedFormat?.id
    const jobId = initialJobData.id
    const { data: job } = useJob(initialJobData)

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
                    className="justify-start w-min sm:w-44"
                >
                    <LoaderCircle className="animate-spin" />
                    <span className="hidden sm:flex items-center gap-2">
                        {dictionary[locale]['processing']}
                    </span>
                </Button>
            ) : isError ? (
                <Button
                    onClick={() => retryProcessing(jobId)}
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
            <DownloadJobButton
                isFormatSelected={!!formatId}
                downloadUrl={downloadUrl}
            />
            <CancelJobButton jobId={jobId} />
        </div>
    )
}
