import type { Job, JobWithFormats } from '@/common/types'
import type { CreateJobsSchema, JobStatusSchema } from '@/common/zod/job'
import { supabase } from '@/lib/supabase/client'
import { handleApiResponse } from '@/lib/utils/handle-api-response'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'sonner'
import useDictionary from './dictionary'

export function useJobs(requestId: string | null) {
    const queryClient = useQueryClient()
    return useQuery<JobWithFormats[]>({
        queryKey: ['jobs', { requestId }],
        queryFn: async () =>
            (await handleApiResponse(
                await fetch(`/requests/${requestId}`),
            )) as JobWithFormats[],
        enabled: !!requestId,
        refetchOnWindowFocus: false,
    })
}

export function useCreateJobs() {
    const queryClient = useQueryClient()
    const dictionary = useDictionary()
    return useMutation({
        mutationFn: async (
            jobs: CreateJobsSchema,
        ): Promise<{ requestId: string }> =>
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

type SupabaseRealtimePayload = {
    schema: string
    table: string
    eventType: 'INSERT' | 'UPDATE' | 'DELETE'
    old: Job
    new: Job
}

export function useJob(initialData?: JobWithFormats) {
    const queryClient = useQueryClient()
    const jobId = initialData?.id

    const jobQuery = useQuery<JobWithFormats>({
        queryKey: ['jobs', { jobId }],
        queryFn: async () => handleApiResponse(await fetch(`/jobs/${jobId}`)),
        initialData,
        enabled: !!jobId,
    })

    useEffect(() => {
        if (!jobId) return

        const channel = supabase
            .channel(`jobs-status-${jobId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'jobs',
                    filter: `id=eq.${jobId}`,
                },
                async (payload) => {
                    const newStatus = payload.new.status as JobStatusSchema
                    await queryClient.setQueryData(
                        ['jobs', { jobId }],
                        (oldData: JobWithFormats) => ({
                            ...oldData,
                            status: newStatus,
                        }),
                    )
                    await jobQuery.refetch()
                },
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [jobId])

    return jobQuery
}
