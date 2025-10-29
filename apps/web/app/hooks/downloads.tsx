import { FormatDownload } from '@/common/types'
import { supabase } from '@/lib/supabase/client'
import { handleApiResponse } from '@/lib/utils/handle-api-response'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { create } from 'zustand'
import useDictionary from './dictionary'

export function useStartDownload() {
    const dictionary = useDictionary()
    return useMutation({
        mutationFn: async (download: FormatDownload) => {
            await handleApiResponse(
                await fetch(`/downloads/${download.formatId}/start`, {
                    method: 'POST',
                }),
            )
        },
        onMutate: async (download, context) => {
            await context.client.cancelQueries({
                queryKey: ['downloads', { requestId: download.requestId }],
            })

            const previousDownloads = context.client.getQueryData([
                'downloads',
                { requestId: download.requestId },
            ]) as FormatDownload[]

            const newDownload: FormatDownload = {
                ...download,
                downloadStatus: 'waiting-to-download',
            }

            context.client.setQueryData(
                ['downloads', { requestId: download.requestId }],
                [
                    ...previousDownloads.filter(
                        (d) => d.formatId !== download.formatId,
                    ),
                    newDownload,
                ],
            )

            return { previousDownloads }
        },
        onError: (err, download, onMutateResult, context) => {
            if (onMutateResult) {
                context.client.setQueryData(
                    ['downloads', { requestId: download.requestId }],
                    onMutateResult.previousDownloads,
                )
            }
            toast.error(dictionary.error.download)
        },
        onSettled: (_, error, download, onMutateResult, context) =>
            context.client.invalidateQueries({
                queryKey: ['downloads', { requestId: download.requestId }],
            }),
    })
}

export function useCancelDownload() {
    const dictionary = useDictionary()
    return useMutation({
        mutationFn: async (download: FormatDownload) => {
            await handleApiResponse(
                await fetch(`/downloads/${download.formatId}/cancel`, {
                    method: 'POST',
                }),
            )
        },
        onMutate: async (download, context) => {
            await context.client.cancelQueries({
                queryKey: ['downloads', { requestId: download.requestId }],
            })

            const previousDownloads = context.client.getQueryData([
                'downloads',
                { requestId: download.requestId },
            ]) as FormatDownload[]

            context.client.setQueryData(
                ['downloads', { requestId: download.requestId }],

                previousDownloads.filter(
                    (d) => d.formatId !== download.formatId,
                ),
            )

            return { previousDownloads }
        },
        onError: (err, download, onMutateResult, context) => {
            if (onMutateResult) {
                context.client.setQueryData(
                    ['downloads', { requestId: download.requestId }],
                    onMutateResult.previousDownloads,
                )
            }
            toast.error(dictionary.error.cancel_download)
        },
        onSettled: (_, error, download, onMutateResult, context) =>
            context.client.invalidateQueries({
                queryKey: ['downloads', { requestId: download.requestId }],
            }),
    })
}

export function useDownloadsByRequestId(requestId?: string | null) {
    return useQuery<FormatDownload[]>({
        queryKey: ['downloads', { requestId }],
        queryFn: async () =>
            await handleApiResponse(
                await fetch(`/downloads/request/${requestId}`),
            ),
        enabled: !!requestId,
        refetchOnWindowFocus: false,
        placeholderData: (prev) => prev,
    })
}

interface DownloadsPopoverState {
    open: boolean
    setOpen: (open: boolean) => void
}

export const useDownloadsPopover = create<DownloadsPopoverState>((set) => {
    return {
        open: false,
        setOpen: (open: boolean) =>
            set(() => ({
                open: open,
            })),
    }
})
