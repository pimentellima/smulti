import { Format } from '@/common/types'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getLanguageLabel } from '@/lib/dictionaries/language-labels'
import { Check, ChevronDown } from 'lucide-react'
import { useLocale } from '../hooks/locale'

interface FormatSelectosProps {
    onSelect: (format: Format) => void
    formats: Format[]
    selectedFormat: Format | null
    isLoadingFormats?: boolean
    disabled?: boolean
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
    formats,
    onSelect,
    isLoadingFormats = false,
    disabled,
    selectedFormat,
}: FormatSelectosProps) {
    const locale = useLocale()

    const sortedFormats = formats
        .filter((a) => a.vcodec !== 'none' && a.acodec !== 'none')
        .sort((a, b) => {
            if (!a.resolution || !b.resolution) return 0
            const aWidth = parseInt(a.resolution.split('x')[0]!, 10)
            const bWidth = parseInt(b.resolution.split('x')[0]!, 10)
            if (bWidth !== aWidth) {
                return bWidth - aWidth
            }
            if (!a.filesize || !b.filesize) return 0
            return b.filesize! - a.filesize
        })

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    disabled={disabled}
                    variant="outline"
                    className="justify-between w-min sm:w-48"
                >
                    {selectedFormat ? (
                        <FormatLabel format={selectedFormat} />
                    ) : (
                        formatDictionary[locale].format
                    )}
                    <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-min sm:w-48 max-h-[300px] overflow-y-auto">
                <DropdownMenuGroup>
                    {sortedFormats.map((format) => (
                        <DropdownMenuItem
                            key={format.id}
                            onClick={() => {
                                onSelect(format)
                            }}
                            className="flex justify-between text-sm"
                        >
                            <FormatLabel format={format} />
                            <div className="flex gap-1">
                                {selectedFormat?.id === format.id && (
                                    <Check className="h-4 w-4 ml-2" />
                                )}
                            </div>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function FormatLabel({ format }: { format: Format }) {
    const formatFileResolution = (resolution: string) => {
        const [_, height] = resolution.split('x')
        const heightNumber = parseInt(height!, 10)
        return `${heightNumber}p`
    }

    const isHighQuality = (format: Format) => {
        if (!format.resolution) return false
        const [width, height] = format.resolution.split('x')
        const widthNumber = parseInt(width!, 10)
        const heightNumber = parseInt(height!, 10)
        return widthNumber >= 1080 && heightNumber >= 720
    }

    const getFormatLabel = (format: Format) => {
        if (format.resolution) {
            return `${format.ext} (${formatFileResolution(format.resolution)})`
        }
        if (format.language)
            return `${format.ext} ${getLanguageLabel(format.language)}`
        return `${format.ext}`
    }

    return (
        <span>
            {getFormatLabel(format)}
            {isHighQuality(format) && (
                <span className="ml-1 text-xs font-bold text-primary">HD</span>
            )}
        </span>
    )
}
