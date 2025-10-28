import { z } from 'zod'
import { downloadStatusEnum, jobStatusEnum } from '@/db/schema'

export const createJobsSchema = z.object({
    requestId: z.string().uuid().nullish(),
    urls: z.array(z.string().url()),
})

export const statusEnum = z.enum(jobStatusEnum.enumValues)
export type JobStatus = z.infer<typeof statusEnum>

export const downloadStatus = z.enum(downloadStatusEnum.enumValues)
export type DownloadStatus = z.infer<typeof downloadStatus>

export const downloadJobByRequestSchema = z.object({
    requestId: z.string().uuid(),
    formatId: z.string(),
})

export const jobFormatSchema = z.object({
    jobId: z.string().uuid(),
    formatId: z.string(),
})

export const convertSchema = z.object({
    videoFormatId: z.string().uuid(),
    audioFormatId: z.string().uuid(),
})

export type CreateJobsSchema = z.infer<typeof createJobsSchema>

export type FormatDownload = {
    title: string
    thumbnail?: string
    downloadStatus: DownloadStatus
    downloadUrl?: string
}
