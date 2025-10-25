import type { JobWithFormats } from '@/common/types'
import { isJobConverting, isJobProcessing } from '@/common/utils'
import type { ColumnDef } from '@tanstack/table-core'
import { Button } from '@/components/ui/button'
import { DownloadIcon, XIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { LinksTable } from '../components/links-table'
import { useCancelJob, useJobs } from '../hooks/jobs'
import { useLocale } from '../hooks/locale'
import FormatSelector, { type FormatOption } from './format-selector'
import JobDownloadButton from './job-download-button'

const downloadDictionary = {
    'en-US': {
        downloadAll: 'Download All',
        title: 'Title',
        actions: 'Actions',
        delete: 'Delete',
        processing: 'Processing...',
        'error-processing': 'Error processing',
    },
    'pt-BR': {
        downloadAll: 'Baixar Todos',
        title: 'Título',
        actions: 'Ações',
        delete: 'Excluir',
        processing: 'Processando...',
        'error-processing': 'Erro ao processar',
    },
}

interface DownloaderProps {
    setPageError: (error: string | undefined) => void
}

export default function Downloader({ setPageError }: DownloaderProps) {
    const locale = useLocale()
    const dictionary = downloadDictionary[locale] || downloadDictionary['en-US']
    const [searchParams, setSearchParams] = useSearchParams()
    const [selectedFormats, setSelectedFormats] = useState<
        { jobId: string; formatId: string }[]
    >([])
    const [selectedDownloadAllFormat, setSelectedDownloadAllFormat] = useState<
        string | null
    >(null)
    const requestId = searchParams.get('requestId')
    const [pollingIds, setPollingIds] = useState<Set<string>>(new Set())

    const startPolling = (id: string) => {
        setPollingIds((prev) => new Set(prev).add(id))
    }

    const startPollingAll = () => {
        const allPending =
            jobs?.filter((j) => j.status !== 'finished-processing') ?? []
        setPollingIds(new Set(allPending.map((j) => j.id)))
    }

    const cancelJob = useCancelJob()
    /*     const retryJobs = useRetryJobs()
    const [retryingJobs, setRetryingJobs] = useState<Record<string, boolean>>(
        {},
    ) */

    const handleRemoveJob = async (jobId: string) => {
        try {
            await cancelJob.mutateAsync(jobId)
        } catch (err) {
            setPageError('Failed to remove job')
        }
    }

    /*     const handleRetry = async (jobId: string) => {
        try {
            setRetryingJobs((prev) => ({ ...prev, [jobId]: true }))
            await retryJobs.mutateAsync({ ids: [jobId] })
        } catch (err) {
            setPageError('Failed to retry job')
        } finally {
            setRetryingJobs((prev) => ({ ...prev, [jobId]: false }))
        }
    }
    const handleRetryAll = async () => {
        if (!requestId) return

        try {
            await retryJobs.mutateAsync({ requestId })
        } catch (err) {
            setPageError(
                err instanceof Error ? err.message : 'Failed to retry jobs',
            )
        }
    } */
    const { data: jobs, isLoading: isLoadingJobs } = useJobs(requestId)

    const canDownloadCount = (jobs || []).filter(
        (job) => job.status === 'finished-processing',
    ).length

    /*     const failedJobsCount = (jobs || []).filter(
        (job) => job.status === 'error',
    ).length */

    const getCommonFormats = () => {
        const formats = jobs?.map((job) => job.formats || [])
        if (!formats || formats.length === 0) return []

        return formats
            .reduce((acc, list) => {
                const idsInList = new Set(list.map((f) => f.formatId))
                return acc.filter((f) => idsInList.has(f.formatId))
            })
            .map((f) => {
                const { filesize, ...format } = f
                return format
            })
    }
    const commonFormats = useMemo(() => getCommonFormats(), [jobs])

    const onSelectFormat = (format: FormatOption, jobId: string) => {
        setSelectedFormats([
            ...selectedFormats.filter((job) => job.jobId !== jobId),
            { jobId, formatId: format.id },
        ])
    }
    const columns: ColumnDef<JobWithFormats>[] = useMemo(
        () => [
            {
                id: 'actions',
                header: dictionary.actions,
                cell: ({ row }) => {
                    const job = row.original
                    const formatId = selectedFormats.find(
                        (format) => format.jobId === job.id,
                    )?.formatId

                    const isProcessing = isJobProcessing(job)
                    return (
                        <div className="flex gap-1 w-min">
                            {isProcessing ? (
                                <Button
                                    disabled
                                    variant="outline"
                                    className="justify-between w-min"
                                >
                                    <span className="hidden sm:flex items-center gap-2">
                                        {
                                            downloadDictionary[locale][
                                                'processing'
                                            ]
                                        }
                                    </span>
                                </Button>
                            ) : job.status === 'error-processing' ? (
                                <Button
                                    disabled
                                    variant="destructive"
                                    className="justify-between w-min"
                                >
                                    <span className="hidden sm:flex items-center gap-2">
                                        {
                                            downloadDictionary[locale][
                                                'error-processing'
                                            ]
                                        }
                                    </span>
                                </Button>
                            ) : (
                                <FormatSelector
                                    formatOptions={job.formats}
                                    selectedFormat={job.formats.find(
                                        (format) => format.id === formatId,
                                    )}
                                    disabled={
                                        job.formats.length === 0 || isProcessing
                                    }
                                    isLoadingFormats={isProcessing}
                                    onSelect={(format) =>
                                        onSelectFormat(format, job.id)
                                    }
                                />
                            )}
                            {formatId ? (
                                <JobDownloadButton
                                    jobId={job.id}
                                    formatId={formatId}
                                    enablePolling={pollingIds.has(job.id)}
                                    onStartPolling={() => startPolling(job.id)}
                                />
                            ) : (
                                <Button
                                    size={'icon'}
                                    variant={'outline'}
                                    disabled
                                >
                                    <DownloadIcon className="h-4 w-4" />
                                </Button>
                            )}
                            <Button
                                size="icon"
                                title={dictionary.delete}
                                onClick={() => handleRemoveJob(job.id)}
                                variant={'outline'}
                            >
                                <XIcon />
                            </Button>
                        </div>
                    )
                },
                size: 25,
                maxSize: 25,
            },
            {
                accessorKey: 'title',
                header: dictionary.title,
                cell: ({ row }) => {
                    return (
                        <div>
                            <div className="font-medium truncate">
                                {row.original.title || 'Untitled'}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                                {row.original.url}
                            </div>
                        </div>
                    )
                },
                minSize: 700,
                maxSize: 500,
                size: 200,
            },
        ],
        [jobs, selectedFormats, pollingIds],
    )

    if (!jobs) return null

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4 mt-4">
                <div className="flex items-center justify-center sm:justify-start w-full space-x-1">
                    <FormatSelector
                        disabled={isLoadingJobs || !commonFormats.length}
                        selectedFormat={
                            commonFormats.find(
                                (f: any) =>
                                    f.formatId === selectedDownloadAllFormat,
                            ) || undefined
                        }
                        onSelect={(format) => {
                            setSelectedDownloadAllFormat(format.id)
                        }}
                        formatOptions={commonFormats}
                    />
                    <Button
                        disabled={
                            isLoadingJobs ||
                            canDownloadCount === 0 ||
                            !selectedDownloadAllFormat
                        }
                        onClick={startPollingAll}
                    >
                        {dictionary.downloadAll}
                    </Button>

                    {/*     {failedJobsCount > 0 && (
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={handleRetryAll}
                            disabled={retryJobs.isPending}
                        >
                            {retryJobs.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                    {downloaderDictionary[locale].retrying}
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="mr-2 h-3 w-3" />
                                    {`${downloaderDictionary[locale].retry} (${failedJobsCount})`}
                                </>
                            )}
                        </Button>
                    )} */}
                </div>
            </div>
            <LinksTable
                data={jobs || []}
                isLoading={isLoadingJobs}
                columns={columns}
            />
        </div>
    )
}
