import type { InferSelectModel } from 'drizzle-orm'
import { z } from 'zod'
import { formats, jobStatusEnum, mergedFormatsStatusEnum } from '@/db/schema'

export const createJobsSchema = z.object({
    requestId: z.string().uuid().nullish(),
    urls: z.array(z.string().url()),
})

export const statusSchema = z.enum(jobStatusEnum.enumValues)
export type JobStatusSchema = z.infer<typeof statusSchema>

export const mergedFormatStatusSchema = z.enum(mergedFormatsStatusEnum.enumValues)
export type ConvertFormatStatus = z.infer<typeof mergedFormatStatusSchema>

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

export const retryJobsSchema = z
    .object({
        ids: z.string().uuid().array().optional(),
        requestId: z.string().uuid().nullish(),
    })
    .refine(
        (val) => (val.ids && !val.requestId) || (!val.ids && val.requestId),
        {
            message: 'Either ids or requestId is required, but not both',
        }
    )

export type RetryJobsSchema = z.infer<typeof retryJobsSchema>
export type CreateJobsSchema = z.infer<typeof createJobsSchema>
