import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Check,
    ChevronDown,
    FileAudio,
    FileVideo
} from 'lucide-react'
import { useMemo } from 'react'
import { useLocale } from '../hooks/locale'
import { getLanguageLabel } from '@/lib/dictionaries/language-labels'

interface FormatSelectosProps {
    onSelect: (format: FormatOption) => void
    formatOptions: FormatOption[]
    selectedFormat: FormatOption | undefined
    isLoadingFormats?: boolean
    disabled?: boolean
}

export interface FormatOption {
    id: string
    ext: string
    resolution?: string | null
    acodec?: string | null
    vcodec?: string | null
    filesize?: number | null
    formatNote?: string | null
    language?: string | null
}

const formatDictionary = {
    'pt-BR': {
        video: 'Vídeo',
        audio: 'Áudio',
        format: 'Formato',
    },
    'en-US': {
        video: 'Video',
        audio: 'Audio',
        format: 'Format',
    },
}

export default function FormatSelector({
    formatOptions,
    onSelect,
    isLoadingFormats = false,
    disabled,
    selectedFormat,
}: FormatSelectosProps) {
    const locale = useLocale()
    const audioFormats = useMemo(
        () =>
            formatOptions.filter(
                (format) =>
                    format.acodec !== 'none' && format.vcodec === 'none',
            ),
        [formatOptions],
    )
    const videoFormats = useMemo(
        () => formatOptions.filter((format) => format.vcodec !== 'none'),
        [formatOptions],
    )

    const formatFileSize = (megabytes: number) => {
        if (megabytes < 1) return (megabytes * 1024).toFixed(1) + ' KB'
        else if (megabytes < 1024) return megabytes.toFixed(1) + ' MB'
        else return (megabytes / 1024).toFixed(1) + ' GB'
    }

    const isHighQuality = (format: FormatOption) => {
        if (!format.resolution) return false
        const [width, height] = format.resolution.split('x')
        const widthNumber = parseInt(width!, 10)
        const heightNumber = parseInt(height!, 10)
        return widthNumber >= 1080 && heightNumber >= 720
    }

    const formatFileResolution = (resolution: string) => {
        const [_, height] = resolution.split('x')
        const heightNumber = parseInt(height!, 10)
        return `${heightNumber}p`
    }

    const videoFormatsSorted = useMemo(() => {
        return videoFormats.sort((a, b) => {
            if (!a.resolution || !b.resolution) return 0
            const aWidth = parseInt(a.resolution.split('x')[0]!, 10)
            const bWidth = parseInt(b.resolution.split('x')[0]!, 10)
            return bWidth - aWidth
        })
    }, [videoFormats])

    const audioFormatsSorted = useMemo(() => {
        return audioFormats.sort((a, b) => {
            if (
                a.formatNote?.includes('original') &&
                !b.formatNote?.includes('original')
            )
                return -1
            if (
                !a.formatNote?.includes('original') &&
                b.formatNote?.includes('original')
            )
                return 1
            if (!a.filesize || !b.filesize) return 0
            return b.filesize - a.filesize
        })
    }, [audioFormats])

    const getFormatLabel = (format: FormatOption) => {
        if (format.resolution) {
            return `${format.ext} (${formatFileResolution(format.resolution)})`
        }
        if (format.language)
            return `${format.ext} ${getLanguageLabel(format.language)}`
        return `${format.ext}`
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    disabled={disabled}
                    variant="outline"
                    className="justify-between w-min"
                >
                    {selectedFormat ? (
                        <span className="flex items-center gap-2">
                            {selectedFormat.resolution ? (
                                <FileVideo className="h-4 w-4" />
                            ) : (
                                <FileAudio className="h-4 w-4" />
                            )}
                            {getFormatLabel(selectedFormat)}
                        </span>
                    ) : (
                        formatDictionary[locale].format
                    )}
                    <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-max max-h-[300px] overflow-y-auto">
                {videoFormatsSorted.length > 0 && (
                    <>
                        <DropdownMenuLabel>
                            <span className="flex items-center gap-2">
                                <FileVideo className="h-4 w-4" />
                                {formatDictionary[locale].video}
                            </span>
                        </DropdownMenuLabel>
                        <DropdownMenuGroup>
                            {videoFormatsSorted.map((format) => (
                                <DropdownMenuItem
                                    key={format.id}
                                    onClick={() => {
                                        onSelect(format)
                                    }}
                                    className="flex justify-between text-sm"
                                >
                                    <span>
                                        {getFormatLabel(format)}
                                        {isHighQuality(format) && (
                                            <span className="ml-1 text-xs font-bold text-primary">
                                                HD
                                            </span>
                                        )}
                                    </span>
                                    <div className="flex gap-1">
                                        {selectedFormat?.id === format.id && (
                                            <Check className="h-4 w-4 ml-2" />
                                        )}
                                    </div>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>
                    </>
                )}

                {audioFormats.length > 0 && videoFormats.length > 0 && (
                    <DropdownMenuSeparator />
                )}

                {audioFormatsSorted.length > 0 && (
                    <>
                        <DropdownMenuLabel>
                            <span className="flex items-center gap-2">
                                <FileAudio className="h-4 w-4" />
                                {formatDictionary[locale].audio}
                            </span>
                        </DropdownMenuLabel>
                        <DropdownMenuGroup>
                            {audioFormatsSorted.map((format) => (
                                <DropdownMenuItem
                                    key={format.id}
                                    onClick={() => {
                                        onSelect(format)
                                    }}
                                    className="flex justify-between text-sm"
                                >
                                    {getFormatLabel(format)}
                                    <div className="flex gap-1">
                                        {selectedFormat?.id === format.id && (
                                            <Check className="h-4 w-4 ml-2" />
                                        )}
                                    </div>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
