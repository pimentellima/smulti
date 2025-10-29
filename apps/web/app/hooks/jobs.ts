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
        onMutate: async (job, context) => {
            if (job.requestId) {
                await context.client.cancelQueries({
                    queryKey: ['jobs', { requestId: job.requestId }],
                })

                const previousJobs = context.client.getQueryData([
                    'jobs',
                    { requestId: job.requestId },
                ]) as JobWithFormats[]

                const newJobs = job.urls.map((url) => ({
                    createdAt: new Date(),
                    formats: [],
                    requestId: job.requestId,
                    status: 'waiting-to-process' as JobStatus,
                    thumbnail: null,
                    title: '-',
                    url,
                    id: 'temp-id-' + Math.random().toString(36).substr(2, 9),
                })) as JobWithFormats[]

                context.client.setQueryData(
                    ['jobs', { requestId: job.requestId }],
                    [...previousJobs, ...newJobs],
                )

                return { previousJobs }
            }
            return { previousJobs: [] }
        },
        onError: (err, job, onMutateResult, context) => {
            if (onMutateResult) {
                context.client.setQueryData(
                    ['jobs', { requestId: job.requestId }],
                    onMutateResult.previousJobs,
                )
            }
            toast.error(dictionary.error.create_job)
        },
        onSettled: (_, error, job, onMutateResult, context) => {
            if (job.requestId) {
                context.client.invalidateQueries({
                    queryKey: ['jobs', { requestId: job.requestId }],
                })
            }
        },
    })
}

export function useRetryJob() {
    const dictionary = useDictionary()

    return useMutation({
        mutationFn: async (job: Job) =>
            await handleApiResponse(
                await fetch(`/jobs/retry/${job.id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }),
            ),
        onMutate: async (job, context) => {
            await context.client.cancelQueries({
                queryKey: ['jobs', { requestId: job.requestId }],
            })

            const previousJobs = context.client.getQueryData([
                'jobs',
                { requestId: job.requestId },
            ]) as JobWithFormats[]

            const newJob = {
                ...job,
                status: 'waiting-to-process',
            } as JobWithFormats

            context.client.setQueryData(
                ['jobs', { requestId: job.requestId }],
                [...previousJobs.filter((j) => j.id !== job.id), newJob],
            )

            return { previousJobs }
        },
        onError: (err, job, onMutateResult, context) => {
            if (onMutateResult) {
                context.client.setQueryData(
                    ['jobs', { requestId: job.requestId }],
                    onMutateResult.previousJobs,
                )
            }
            toast.error(dictionary.error.retry_job)
        },
        onSettled: (_, error, job, onMutateResult, context) =>
            context.client.invalidateQueries({
                queryKey: ['jobs', { requestId: job.requestId }],
            }),
    })
}

export function useCancelJob() {
    const dictionary = useDictionary()
    return useMutation({
        mutationFn: async (job: Job) =>
            await fetch(`/jobs/${job.id}/cancel`, {
                method: 'PUT',
            }),
        onMutate: async (job, context) => {
            await context.client.cancelQueries({
                queryKey: ['jobs', { requestId: job.requestId }],
            })

            const previousJobs = context.client.getQueryData([
                'jobs',
                { requestId: job.requestId },
            ]) as JobWithFormats[]

            context.client.setQueryData(
                ['jobs', { requestId: job.requestId }],
                previousJobs.filter((j) => j.id !== job.id),
            )

            return { previousJobs }
        },
        onError: (err, job, onMutateResult, context) => {
            if (onMutateResult) {
                context.client.setQueryData(
                    ['jobs', { requestId: job.requestId }],
                    onMutateResult.previousJobs,
                )
            }
            toast.error(dictionary.error.cancel_job)
        },
        onSettled: (_, error, job, onMutateResult, context) =>
            context.client.invalidateQueries({
                queryKey: ['jobs', { requestId: job.requestId }],
            }),
    })
}
