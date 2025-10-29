import type { JobWithFormats } from '@/common/types'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { useJobsByRequestId } from '@/hooks/jobs'
import { useUrlParams } from '@/hooks/url-params'
import {
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
    type ColumnDef,
} from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, Loader2Icon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocale } from '../hooks/locale'
import DownloadsPopover from './downloads-popover'
import JobActions from './job-actions'

const tableDictionary = {
    'en-US': {
        title: 'Title',
        actions: 'Actions',
        noResults: 'No results.',
        pageInfo: (currentPage: number, pageCount: number, itemCount: number) =>
            `Page ${currentPage} of ${pageCount} • ${itemCount} items`,
        previousPage: 'Previous page',
        nextPage: 'Next page',
    },
    'pt-BR': {
        title: 'Título',
        actions: 'Ações',
        noResults: 'Nenhum resultado.',
        pageInfo: (currentPage: number, pageCount: number, itemCount: number) =>
            `Página ${currentPage} de ${pageCount} • ${itemCount} itens`,
        previousPage: 'Página anterior',
        nextPage: 'Próxima página',
    },
}

export function JobsTable() {
    const locale = useLocale()
    const { requestId } = useUrlParams()
    console.log({ requestId })
    const dictionary = tableDictionary[locale] || tableDictionary['en-US']
    const { data: jobs, isLoading: isLoadingJobs } = useJobsByRequestId(
        requestId!,
    )
    const [downloadsPopoverOpen, setDownloadsPopoverOpen] = useState(false)

    const columns: ColumnDef<JobWithFormats>[] = useMemo(
        () => [
            {
                accessorKey: 'actions',
                id: 'actions',
                header: dictionary.actions,
                cell: ({ row }) => (
                    <JobActions
                        onClickDownload={() => {
                            setDownloadsPopoverOpen(true)
                        }}
                        job={row.original}
                    />
                ),
            },
            {
                accessorKey: 'title',
                id: 'title',
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
            },
        ],
        [jobs],
    )

    const sortedJobs = useMemo(() => {
        if (!jobs) return []
        return jobs.sort(
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
        )
    }, [jobs])

    const table = useReactTable({
        data: sortedJobs,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    })

    if (!jobs) return null

    return (
        <>
            <div className="absolute top-4 right-4">
                <DownloadsPopover />
            </div>
            <div className="space-y-4 w-full my-4 space-x-1 ">
                <div className="rounded-md border bg-background max-w-[80vw] md:max-w-full overflow-auto">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead
                                            key={header.id}
                                            style={{ width: header.getSize() }}
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
                                                      header.getContext(),
                                                  )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {isLoadingJobs ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-20 text-center"
                                    >
                                        <Loader2Icon className="animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : table.getRowModel().rows.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-20 text-center"
                                    >
                                        {dictionary.noResults}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={
                                            row.getIsSelected() && 'selected'
                                        }
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext(),
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                        {dictionary.pageInfo(
                            table.getState().pagination.pageIndex + 1,
                            table.getPageCount(),
                            jobs?.length || 0,
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">
                                {dictionary.previousPage}
                            </span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronRight className="h-4 w-4" />
                            <span className="sr-only">
                                {dictionary.nextPage}
                            </span>
                        </Button>
                    </div>
                </div>
            </div>
        </>
    )
}
