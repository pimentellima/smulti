import type { Job, JobWithFormats } from '@/common/types'
import type { CreateJobsSchema, JobStatus } from '@/common/zod'
import { supabase } from '@/lib/supabase/client'
import { handleApiResponse } from '@/lib/utils/handle-api-response'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'sonner'
import useDictionary from './dictionary'

export function useJobsByRequestId(requestId: string | null) {
    const query = useQuery<JobWithFormats[]>({
        queryKey: ['jobs', { requestId }],
        queryFn: async () =>
            await handleApiResponse(await fetch(`/jobs/request/${requestId}`)),
        enabled: !!requestId,
        refetchOnWindowFocus: false,
    })

    useEffect(() => {
        if (!requestId) return

        const channel = supabase
            .channel(`jobs-status-${requestId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'jobs',
                    filter: `request_id=eq.${requestId}`,
                },
                async () => await query.refetch(),
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [requestId])

    return query
}

export function useCreateJobs() {
    const dictionary = useDictionary()
    return useMutation({
        mutationFn: async (jobs: CreateJobsSchema) =>
            handleApiResponse<{ requestId: string }>(
                await fetch(`/jobs`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(jobs),
                }),
            ),
        onError: () => toast.error(dictionary.error.create_job),
        onSuccess: async (data, variables, _, context) =>
            context.client.invalidateQueries({
                queryKey: ['jobs', { requestId: data.requestId }],
            }),
    })
}

export function useRetryJob(job: Job) {
    const dictionary = useDictionary()
    const jobId = job.id
    const requestId = job.requestId

    return useMutation({
        mutationFn: async () =>
            await handleApiResponse(
                await fetch(`/jobs/retry/${jobId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }),
            ),
        onMutate: async (_, context) => {
            await context.client.cancelQueries({
                queryKey: ['jobs', { requestId }],
            })

            const previousJobs = context.client.getQueryData([
                'jobs',
                { requestId },
            ]) as JobWithFormats[]

            const newJob = {
                ...job,
                status: 'waiting-to-process',
            } as JobWithFormats

            context.client.setQueryData(
                ['jobs', { requestId }],
                [...previousJobs.filter((j) => j.id !== job.id), newJob],
            )

            return { previousJobs }
        },
        onError: (err, _, onMutateResult, context) => {
            if (onMutateResult) {
                context.client.setQueryData(
                    ['jobs', { requestId }],
                    onMutateResult.previousJobs,
                )
            }
            toast.error(dictionary.error.retry_job)
        },
        onSettled: (_, error, variables, onMutateResult, context) =>
            context.client.invalidateQueries({
                queryKey: ['jobs', { requestId }],
            }),
    })
}

export function useCancelJob(job: Job) {
    const dictionary = useDictionary()
    return useMutation({
        mutationFn: async () =>
            await fetch(`/jobs/${job.id}/cancel`, {
                method: 'PUT',
            }),
        onError: () => toast.error(dictionary.error.cancel_job),
        onSuccess: async (data, variables, _, context) =>
            context.client.invalidateQueries({
                queryKey: ['jobs', { requestId: job.requestId }],
            }),
    })
}
