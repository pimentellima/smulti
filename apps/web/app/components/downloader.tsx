import type { JobWithFormats } from '@/common/types'
import {
    getJobDownloadUrl,
    isJobProcessing,
    isJobProcessingError,
} from '@/common/utils'
import { Button } from '@/components/ui/button'
import type { ColumnDef } from '@tanstack/table-core'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { LinksTable } from '../components/links-table'
import { useCancelJob, useJobs, useRetryJob } from '../hooks/jobs'
import { useLocale } from '../hooks/locale'
import CancelJobButton from './cancel-job-button'
import DownloadJobButton from './download-job-button'
import FormatSelector, { type FormatOption } from './format-selector'

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

export default function Downloader() {
    const locale = useLocale()
    const dictionary = downloadDictionary[locale] || downloadDictionary['en-US']
    const [searchParams] = useSearchParams()
    const [selectedFormats, setSelectedFormats] = useState<
        { jobId: string; formatId: string }[]
    >([])
    const [selectedDownloadAllFormat, setSelectedDownloadAllFormat] = useState<
        string | null
    >(null)
    const requestId = searchParams.get('requestId')

    const { data: jobs, isLoading: isLoadingJobs } = useJobs(requestId)
    const { mutate: retryProcessing } = useRetryJob()
    const { mutate: cancelJob } = useCancelJob()

    const canDownloadCount = (jobs || []).filter(
        (job) => job.status === 'finished-processing',
    ).length

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
                    const downloadUrl = getJobDownloadUrl(job, formatId)
                    const isError = isJobProcessingError(job)

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
                            <DownloadJobButton
                                isFormatSelected={!!formatId}
                                onClickRetry={() => retryProcessing(job.id)}
                                isProcessing={isProcessing ?? false}
                                isError={isError ?? false}
                                downloadUrl={downloadUrl}
                            />
                            <CancelJobButton jobId={job.id} />
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
        [jobs, selectedFormats],
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
                        onClick={() => {}}
                    >
                        {dictionary.downloadAll}
                    </Button>
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
