import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { Job, JobWithFormats } from '@/common/types'
import { handleApiResponse } from '@/lib/utils/handle-api-response'
import { JobStatusSchema } from '@/common/zod/job'

type SupabaseRealtimePayload = {
    schema: string
    table: string
    eventType: 'INSERT' | 'UPDATE' | 'DELETE'
    old: Job
    new: Job
}

export function useRealtimeJob(jobId: string) {
    const queryClient = useQueryClient()

    const jobQuery = useQuery<JobWithFormats>({
        queryKey: ['jobs', { jobId }],
        queryFn: async () => handleApiResponse(await fetch(`/jobs/${jobId}`)),
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
                    if (newStatus === 'finished-processing') {
                        await jobQuery.refetch()
                    }
                },
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [jobId])

    return jobQuery
}
