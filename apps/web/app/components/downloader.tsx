import type { JobWithFormats } from '@/common/types'
import type { ColumnDef } from '@tanstack/table-core'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { useJobs } from '../hooks/jobs'
import { useLocale } from '../hooks/locale'
import JobActions from './job-actions'
import { JobsTable } from './jobs-table'

const downloadDictionary = {
    'en-US': {
        title: 'Title',
        actions: 'Actions',
    },
    'pt-BR': {
        title: 'Título',
        actions: 'Ações',
    },
}

export default function Downloader() {
    const locale = useLocale()
    const dictionary = downloadDictionary[locale]
    const [searchParams] = useSearchParams()
    const requestId = searchParams.get('requestId')

    const { data: jobs, isLoading: isLoadingJobs } = useJobs(requestId)

    const columns: ColumnDef<JobWithFormats>[] = useMemo(
        () => [
            {
                id: 'actions',
                header: dictionary.actions,
                cell: ({ row }) => <JobActions jobId={row.original.id} />,
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
        [jobs],
    )

    if (!jobs) return null

    return (
        <JobsTable
            data={jobs || []}
            isLoading={isLoadingJobs}
            columns={columns}
        />
    )
}
