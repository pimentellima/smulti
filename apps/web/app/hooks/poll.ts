import type { JobWithFormats } from '@/common/types'
import { useQuery } from '@tanstack/react-query'
import {
    isJobConvertingError,
    isJobConverting,
    isJobProcessing,
} from '@/common/utils'

export interface JobPoll {
    job: JobWithFormats
    downloadUrl?: string
}

interface PollOptions {
    enablePolling?: boolean
    onDownloadReady?: (downloadUrl: string) => void
}

const fetchJob = async (jobId: string, formatId: string): Promise<JobPoll> => {
    const response = await fetch(`/jobs/${jobId}/${formatId}`)
    if (!response.ok) {
        throw new Error(`Failed to fetch job ${jobId}`)
    }
    return response.json()
}

const pollingIntervals = {
    processing: 2000,
    converting: 1000,
    error: 10000,
}

export const useJobPoll = (
    poll: { jobId: string; formatId: string },
    options: PollOptions = {},
) => {
    const { enablePolling = true, onDownloadReady } = options

    return useQuery({
        queryKey: ['job-poll', poll.jobId, poll.formatId],
        queryFn: () => fetchJob(poll.jobId, poll.formatId),
        enabled: enablePolling,
        refetchInterval: (query: { state: { data?: JobPoll } }) => {
            const data = query.state.data
            if (!data || !enablePolling) return false

            if (data.downloadUrl) {
                onDownloadReady?.(data.downloadUrl)
                return false
            }
            if (isJobProcessing(data.job)) {
                return pollingIntervals.processing
            }
            if (isJobConverting(data.job)) {
                return pollingIntervals.converting
            }
            if (
                data.job.status === 'error-processing' ||
                isJobConvertingError(data.job)
            ) {
                return pollingIntervals.error
            }
        },
        refetchIntervalInBackground: true,
        staleTime: 1000,
    })
}
