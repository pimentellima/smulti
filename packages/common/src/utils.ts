import { JobWithFormats } from './types'
import { JobStatus } from './zod'

export function isJobProcessing(jobStatus?: JobStatus) {
    return (
        !!jobStatus &&
        (jobStatus === 'processing' ||
            jobStatus === 'waiting-to-process' ||
            jobStatus === 'queued-processing')
    )
}

export const isJobProcessingError = (jobStatus?: JobStatus) => {
    return jobStatus === 'error-processing'
}

export function getJobDownloadUrl(job?: JobWithFormats, formatId?: string) {
    const jobFormatIndex = job?.formats?.findIndex((f) => f.id === formatId)
    if (jobFormatIndex !== -1) {
        return job?.formats?.[jobFormatIndex].url
    }
    return null
}
