import {
    useQuery,
    useMutation,
    useQueryClient,
    queryOptions,
} from '@tanstack/react-query'
import { getJobsByRequestId } from '@/core/api'
import type { CreateJobsSchema, RetryJobsSchema } from '@/common/zod/job'
import type { JobWithFormats } from '@/common/types'

export function useJobs(requestId: string | null) {
    return useQuery<JobWithFormats[]>({
        queryKey: ['jobs', requestId],
        queryFn: async () => {
            const response = await fetch(`/jobs/${requestId}`)
            if (!response.ok) {
                throw new Error('Failed to fetch jobs')
            }
            return await response.json()
        },
        enabled: !!requestId,
        refetchInterval: 2000,
    })
}

export function useCreateJobs() {
    const queryClient = useQueryClient()

    return useMutation<{ requestId: string }, unknown, CreateJobsSchema>({
        mutationFn: async (data: CreateJobsSchema) => {
            console.log(data)
            const response = await fetch(`/jobs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })
            console.log(response)
            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to process links')
            }

            return await response.json()
        },
        onSuccess: async (data) => {
            await queryClient.invalidateQueries({
                queryKey: ['jobs', data.requestId],
            })
        },
    })
}

export function useRetryJobs() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: RetryJobsSchema) => {
            const response = await fetch(`/retry`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to retry jobs')
            }

            return await response.json()
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ['jobs'],
            })
        },
    })
}

export function useCancelJob() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (jobId: string) => {
            const response = await fetch(`/jobs/${jobId}/cancel`, {
                method: 'PUT',
            })
            if (!response.ok) {
                throw new Error('Failed to cancel job')
            }
        },
        onSuccess: async () => {
            await queryClient.refetchQueries({
                queryKey: ['jobs'],
            })
        },
    })
}

export function useStartConversion() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            formatId,
            jobId,
        }: {
            jobId: string
            formatId: string
        }) => {
            const response = await fetch(`/jobs/${jobId}/${formatId}`, {
                method: 'POST',
            })
            if (!response.ok) {
                throw new Error('Failed to start conversion')
            }
        },
        onSuccess: async () => {
            await queryClient.refetchQueries({
                queryKey: ['job-poll'],
            })
        },
    })
}
