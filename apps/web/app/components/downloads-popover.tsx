import { FormatDownload } from '@/common/types'
import {
    useCancelDownload,
    useDownloadsByRequestId,
    useDownloadsPopover,
    useStartDownload,
} from '@/hooks/downloads'
import { useLocale } from '@/hooks/locale'
import { DownloadIcon, Loader2Icon, LoaderIcon, XIcon } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { Button } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { triggerDownload } from '@/lib/utils/trigger-download'

const dictionary = {
    'pt-BR': {
        cancelled: 'Cancelado',
        download: 'Baixar',
        'no-downloads': 'Nenhum download iniciado',
        downloading: 'Baixando',
        'error-downloading': 'Erro',
        'finished-downloading': 'Concluído',
        'waiting-to-download': 'Aguardando',
        'queued-downloading': 'Na fila',
        cancel: 'Cancelar',
        'try-again': 'Erro. Tentar novamente',
    },
    'en-US': {
        cancelled: 'Cancelled',
        download: 'Download',
        'no-downloads': 'No downloads started',
        downloading: 'Downloading',
        'error-downloading': 'Error',
        'finished-downloading': 'Finished',
        'waiting-to-download': 'Waiting',
        'queued-downloading': 'Queued',
        cancel: 'Cancel',
        'try-again': 'Error. Try Again',
    },
}

export default function DownloadsPopover() {
    const [params] = useSearchParams()
    const requestId = params.get('requestId')!
    const { open, setOpen } = useDownloadsPopover()
    const locale = useLocale()
    const { data: downloads } = useDownloadsByRequestId(requestId)
    if (!downloads || downloads.length === 0) return null
    const isDownloading = downloads.some(
        (download) => download.downloadStatus === 'downloading',
    )

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={'secondary'}
                    className="rounded-full"
                    size="icon-lg"
                >
                    <DownloadIcon
                        data-downloading={isDownloading}
                        className="data-[downloading=true]:animate-pulse"
                    />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 max-h-[400px] overflow-auto">
                {downloads.length === 0 ? (
                    <span className="text-muted-foreground text-sm">
                        {dictionary[locale]?.['no-downloads']}
                    </span>
                ) : (
                    downloads.map((download) => (
                        <DownloadItem
                            download={download}
                            key={download.formatId}
                        />
                    ))
                )}
            </PopoverContent>
        </Popover>
    )
}

function DownloadItem({ download }: { download: FormatDownload }) {
    const locale = useLocale()
    const { mutate: cancelDownload } = useCancelDownload()
    const { mutate: startDownload, isPending: isPendingDownloadMutation } =
        useStartDownload()
    const queryClient = useQueryClient()
    useEffect(() => {
        const formatId = download.formatId
        const channel = supabase
            .channel(`format-status-${formatId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'formats',
                    filter: `id=eq.${formatId}`,
                },
                async (payload) => {
                    const newFormatDownload = payload.new
                    const oldFormatDownload = payload.old
                    const oldDownloadUrl = oldFormatDownload.download_url
                    const newDownloadUrl = newFormatDownload.download_url
                    if (oldDownloadUrl !== newDownloadUrl && newDownloadUrl) {
                        triggerDownload(
                            newDownloadUrl,
                            download.title || 'file',
                        )
                    }

                    await queryClient.refetchQueries({
                        queryKey: [
                            'downloads',
                            { requestId: download.requestId },
                        ],
                    })
                },
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const isDownloading = download.downloadStatus === 'downloading'

    return (
        <div className="mb-2 pb-2 border-b last:border-0 last:mb-0 last:pb-0">
            <div className="flex items-center gap-2">
                <DownloadButton
                    cancelDownload={() => cancelDownload(download)}
                    startDownload={() => startDownload(download)}
                    isPendingDownloadMutation={isPendingDownloadMutation}
                    download={download}
                />
                <div className="flex justify-between items-center text-muted-foreground flex-1 gap-4">
                    <span className="w-50 truncate text-sm font-medium">
                        {download.title}
                    </span>
                    <span
                        data-is-downloading={isDownloading}
                        className="text-xs flex gap-1 items-center data-[is-downloading=true]:animate-pulse"
                    >
                        {isDownloading && (
                            <LoaderIcon className="animate-spin h-3 w-3" />
                        )}
                        {dictionary[locale][download.downloadStatus!]}
                    </span>
                </div>
            </div>
        </div>
    )
}

function DownloadButton({
    download,
    cancelDownload,
    isPendingDownloadMutation,
    startDownload,
}: {
    download: FormatDownload
    cancelDownload: () => void
    startDownload: () => void
    isPendingDownloadMutation: boolean
}) {
    const locale = useLocale()
    const isError = download.downloadStatus === 'error-downloading'
    const Thumbnail = () =>
        download.thumbnail ? (
            <img
                src={download.thumbnail || ''}
                alt="thumbnail"
                className="rounded-md aspect-square object-cover group-hover:opacity-30 transition-opacity duration-200 ease-out"
            />
        ) : null

    if (download.downloadUrl) {
        return (
            <a
                download
                href={download.downloadUrl}
                title={dictionary[locale]['download']}
                className="relative border h-12 w-12 rounded-md 
                    flex justify-center items-center group cursor-pointer "
            >
                <Thumbnail />
                <DownloadIcon className="absolute opacity-0 group-hover:opacity-100 text-muted transition-opacity duration-200 ease-out h-5 w-5" />
            </a>
        )
    }

    return (
        <button
            onClick={() => (isError ? startDownload() : cancelDownload())}
            disabled={isPendingDownloadMutation}
            title={
                isError
                    ? dictionary[locale]['try-again']
                    : dictionary[locale].cancel
            }
            className="relative border h-12 w-12 rounded-md disabled:opacity-50 transition-opacity disabled:cursor-not-allowed
                    flex justify-center items-center group cursor-pointer "
        >
            <Thumbnail />
            {isError ? (
                <DownloadIcon className="absolute opacity-0 group-hover:opacity-100 text-muted transition-opacity duration-200 ease-out h-5 w-5" />
            ) : (
                <XIcon className="absolute opacity-0 group-hover:opacity-100 text-muted transition-opacity duration-200 ease-out h-5 w-5" />
            )}
        </button>
    )
}
