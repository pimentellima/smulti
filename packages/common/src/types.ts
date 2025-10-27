import { formats, jobs, mergedFormats, requests, users } from '@/db/schema'
import { InferSelectModel } from 'drizzle-orm'

export type Format = InferSelectModel<typeof formats>
export type MergedFormat = InferSelectModel<typeof mergedFormats>
export type Job = InferSelectModel<typeof jobs>
export type Request = InferSelectModel<typeof requests>
export type User = InferSelectModel<typeof users>
export type JobWithFormats = Job & {
    formats: Format[]
}
