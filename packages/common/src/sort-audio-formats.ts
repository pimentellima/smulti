import type { Format } from './types'

export function matchAudioFormatForVideo(
    format: Format,
    availableFormats: Format[],
) {
    return availableFormats
        .filter((f) => f.acodec !== 'none' && f.vcodec === 'none')
        .sort((a, b) => {
            if (
                a.formatNote?.includes('original') &&
                !b.formatNote?.includes('original')
            )
                return -1
            if (
                format.formatNote?.includes('original') &&
                !a.formatNote?.includes('original')
            )
                return 1
            if (format.ext === 'mp4' && a.ext === 'm4a' && b.ext !== 'm4a')
                return -1
            if (format.ext === 'mp4' && b.ext === 'm4a' && a.ext !== 'm4a')
                return 1
            if (format.ext === 'webm' && a.ext === 'webm' && b.ext !== 'webm')
                return -1
            if (format.ext === 'webm' && b.ext === 'webm' && a.ext !== 'webm')
                return 1
            return (a.filesize || 0) - (b.filesize || 0)
        })?.[0]
}
