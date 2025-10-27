import { JobWithFormats } from './types'
import { JobStatusSchema } from './zod/job'

export function isJobProcessing(jobStatus?: JobStatusSchema) {
    return (
        !!jobStatus &&
        (jobStatus === 'processing' ||
            jobStatus === 'waiting-to-process' ||
            jobStatus === 'queued-processing')
    )
}

export const isJobProcessingError = (jobStatus?: JobStatusSchema) => {
    return jobStatus === 'error-processing'
}

export function getJobDownloadUrl(job?: JobWithFormats, formatId?: string) {
    const jobFormatIndex = job?.formats?.findIndex((f) => f.id === formatId)
    if (jobFormatIndex !== -1) {
        return job?.formats?.[jobFormatIndex].url
    }
    return null
}
