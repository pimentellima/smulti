import type { JobWithFormats } from '@/common/types'
import {
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
    type ColumnDef,
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    ChevronLeft,
    ChevronRight,
    Loader2
} from 'lucide-react'
import { useLocale } from '../hooks/locale'

type JobFormatInfo = {
    jobId: string
    formatId: string
}

interface LinksTableProps {
    data: JobWithFormats[]
    columns: ColumnDef<JobWithFormats>[],
    isLoading: boolean
}

const tableDictionary = {
    'en-US': {
        noResults: 'No results.',
        pageInfo: (currentPage: number, pageCount: number, itemCount: number) =>
            `Page ${currentPage} of ${pageCount} • ${itemCount} items`,
        previousPage: 'Previous page',
        nextPage: 'Next page',
    },
    'pt-BR': {
        noResults: 'Nenhum resultado.',
        pageInfo: (currentPage: number, pageCount: number, itemCount: number) =>
            `Página ${currentPage} de ${pageCount} • ${itemCount} itens`,
        previousPage: 'Página anterior',
        nextPage: 'Próxima página',
    },
}

export function JobsTable({
    data,
    columns,
    isLoading,
}: LinksTableProps) {
    const locale = useLocale()
    const dictionary = tableDictionary[locale] || tableDictionary['en-US']

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    })

    return (
        <div className="space-y-4">
            <div className="rounded-md border bg-background">
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
                        {isLoading && (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        )}
                        {!isLoading &&
                            table.getRowModel().rows.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-24 text-center"
                                    >
                                        {dictionary.noResults}
                                    </TableCell>
                                </TableRow>
                            )}
                        {!isLoading &&
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
                            ))}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                    {dictionary.pageInfo(
                        table.getState().pagination.pageIndex + 1,
                        table.getPageCount(),
                        data.length,
                    )}
                </div>
                <div className="flex items-center space-x-2">
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
                        <span className="sr-only">{dictionary.nextPage}</span>
                    </Button>
                </div>
            </div>
        </div>
    )
}
