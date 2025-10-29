import { Format, JobWithFormats } from '@/common/types'
import {
    getJobDownloadUrl,
    isJobProcessing,
    isJobProcessingError,
} from '@/common/utils'
import { useDownloadsPopover, useStartDownload } from '@/hooks/downloads'
import { useRetryJob } from '@/hooks/jobs'
import { useLocale } from '@/hooks/locale'
import { Loader2Icon, XIcon } from 'lucide-react'
import { useState } from 'react'
import CancelJobButton from './cancel-job-button'
import DownloadButton from './download-button'
import FormatSelector from './format-selector'
import { Button } from './ui/button'
import { triggerDownload } from '@/lib/utils/trigger-download'

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
    onClickDownload,
}: {
    job: JobWithFormats
    onClickDownload: () => void
}) {
    const locale = useLocale()
    const { setOpen: setDownloadsPopoverOpen } = useDownloadsPopover()
    const [selectedFormat, setSelectedFormat] = useState<Format | null>(null)
    const formatId = selectedFormat?.id
    const { mutate: retryJob } = useRetryJob(job)
    const { mutate: startDownload, isPending: isPendingDownloadMutation } =
        useStartDownload()
    const isProcessing = isJobProcessing(job?.status)
    const downloadUrl = getJobDownloadUrl(job, formatId)
    const isError = isJobProcessingError(job?.status)
    const handleStartDownload = () => {
        if (downloadUrl) {
            triggerDownload(downloadUrl, job.title ?? 'file')
            return
        }
        startDownload(
            {
                downloadStatus: 'waiting-to-download',
                formatId: formatId!,
                requestId: job.requestId,
                thumbnail: job.thumbnail,
                title: job.title,
                downloadUrl: null,
                jobId: job.id,
            },
            { onSuccess: () => setDownloadsPopoverOpen(true) },
        )
    }

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
                    <Loader2Icon className="animate-spin" />
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
                isPending={isPendingDownloadMutation}
                isDisabled={!selectedFormat}
                onClickDownload={handleStartDownload}
            />
            <CancelJobButton job={job} />
        </div>
    )
}
