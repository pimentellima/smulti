import { formats, jobs, requests, users } from '@/db/schema'
import { InferSelectModel } from 'drizzle-orm'
import { DownloadStatus } from './zod'

export type Format = InferSelectModel<typeof formats>
export type Job = InferSelectModel<typeof jobs>
export type Request = InferSelectModel<typeof requests>
export type User = InferSelectModel<typeof users>
export type JobWithFormats = Job & {
    formats: Format[]
}

export type FormatDownload = {
    title: string | null
    formatId: string
    jobId: string
    requestId: string
    thumbnail: string | null
    downloadStatus: DownloadStatus | null
    downloadUrl: string | null
}
