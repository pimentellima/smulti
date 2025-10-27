import type { JobWithFormats } from '@/common/types'
import type { CreateJobsSchema } from '@/common/zod/job'
import { handleApiResponse } from '@/lib/utils/handle-api-response'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useLocale } from './locale'
import { loadDictionary } from '@/lib/dictionaries/load-dictionary'
import useDictionary from './dictionary'

export function useJobs(requestId: string | null) {
    return useQuery<JobWithFormats[]>({
        queryKey: ['jobs', { requestId }],
        queryFn: async () =>
            handleApiResponse(await fetch(`/requests/${requestId}`)),
        enabled: !!requestId,
        refetchOnWindowFocus: false,
    })
}

export function useCreateJobs() {
    const queryClient = useQueryClient()
    const dictionary = useDictionary()
    return useMutation<{ requestId: string }, unknown, CreateJobsSchema>({
        mutationFn: async (jobs: CreateJobsSchema) =>
            handleApiResponse(
                await fetch(`/jobs`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(jobs),
                }),
            ),
        onError: () => toast.error(dictionary.error.create_job),
        onSuccess: async (data) => {
            await queryClient.invalidateQueries({
                queryKey: ['jobs', { requestId: data.requestId }],
            })
        },
    })
}

export function useRetryJob() {
    const queryClient = useQueryClient()
    const dictionary = useDictionary()

    return useMutation({
        mutationFn: async (jobId: string) => {
            await handleApiResponse(
                await fetch(`/jobs/retry/${jobId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }),
            )
            return jobId
        },
        onError: () => toast.error(dictionary.error.retry_job),
        onSuccess: async (jobId) => {
            await queryClient.invalidateQueries({
                queryKey: ['jobs', { jobId }],
            })
        },
    })
}

export function useCancelJob() {
    const queryClient = useQueryClient()
    const dictionary = useDictionary()
    return useMutation({
        mutationFn: async (jobId: string) =>
            handleApiResponse(
                await fetch(`/jobs/${jobId}`, {
                    method: 'PUT',
                }),
            ),
        onError: () => toast.error(dictionary.error.cancel_job),
        onSuccess: async () => {
            await queryClient.refetchQueries({
                queryKey: ['jobs'],
            })
        },
    })
}
