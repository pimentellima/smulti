import { JobWithFormats } from './types'

export function isJobConverting(job: JobWithFormats) {
    return job.mergedFormats?.some(
        (format) =>
            format.status === 'converting' ||
            format.status === 'waiting-to-convert' ||
            format.status === 'queued-converting',
    )
}

export function isJobProcessing(job: JobWithFormats) {
    return (
        job.status === 'processing' ||
        job.status === 'waiting-to-process' ||
        job.status === 'queued-processing'
    )
}

export function isJobConvertingError(job: JobWithFormats) {
    return job.mergedFormats?.some(
        (format) => format.status === 'error-converting',
    )
}
