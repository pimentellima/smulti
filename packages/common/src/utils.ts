import { JobWithFormats } from './types'

export function isJobProcessing(job?: JobWithFormats) {
    return (
        !!job &&
        (job.status === 'processing' ||
            job.status === 'waiting-to-process' ||
            job.status === 'queued-processing')
    )
}

export const isJobProcessingError = (job?: JobWithFormats) => {
    return !!job && job.status === 'error-processing'
}

export function getJobDownloadUrl(job?: JobWithFormats, formatId?: string) {
    const jobFormatIndex = job?.formats?.findIndex((f) => f.id === formatId)
    if (jobFormatIndex !== -1) {
        return job?.formats?.[jobFormatIndex].url
    }
    return null
}
