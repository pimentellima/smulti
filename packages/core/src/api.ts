import { ApiError } from '@/common/errors'
import { Format, Job, JobWithFormats, MergedFormat } from '@/common/types'
import { JobStatusSchema, ConvertFormatStatus } from '@/common/zod/job'
import { db, type DatabaseType } from '@/db/client'
import {
    formats,
    jobs as jobsTable,
    mergedFormats,
    requests,
} from '@/db/schema'
import {
    and,
    eq,
    inArray,
    isNotNull,
    not,
    or,
    sql,
    type InferInsertModel,
} from 'drizzle-orm'
import { z } from 'zod'

export async function getJob(id: string): Promise<JobWithFormats> {
    const job = await db.query.jobs.findFirst({
        where: eq(jobsTable.id, id),
        with: {
            formats: true,
            mergedFormats: true,
        },
    })

    if (!job) {
        throw new ApiError({
            code: 'not_found',
            message: `Job not found`,
        })
    }

    return job
}

export async function isJobInQueue(jobId: string) {
    const [job] = await db
        .select({
            isJobInQueue: sql<boolean>`COUNT(*) > 0`,
        })
        .from(jobsTable)
        .leftJoin(mergedFormats, eq(jobsTable.id, mergedFormats.jobId))
        .where(
            and(
                eq(jobsTable.id, jobId),
                or(
                    eq(jobsTable.status, 'processing'),
                    eq(jobsTable.status, 'queued-processing'),
                    and(
                        isNotNull(mergedFormats.status),
                        or(
                            eq(mergedFormats.status, 'converting'),
                            eq(mergedFormats.status, 'queued-converting'),
                        ),
                    ),
                ),
            ),
        )

    return job?.isJobInQueue || false
}

export async function getJobsByRequestId(
    requestId?: string | null,
): Promise<JobWithFormats[]> {
    return await db.query.jobs.findMany({
        with: {
            formats: true,
            mergedFormats: true,
        },
        where: and(
            eq(jobsTable.requestId, z.string().parse(requestId)),
            not(eq(jobsTable.status, 'cancelled')),
        ),
    })
}

export async function getRequestById(requestId: string) {
    const request = await db.query.requests.findFirst({
        where: and(eq(requests.id, requestId)),
    })

    if (!request) {
        throw new ApiError({
            code: 'not_found',
            message: `Request not found`,
        })
    }

    return request
}

export async function createRequest() {
    const [request] = await db.insert(requests).values({}).returning()

    return request
}

export async function createJobs(
    jobs: Job[],
    tx?: DatabaseType,
): Promise<Job[]> {
    const database = tx || db

    return await database.insert(jobsTable).values(jobs).returning()
}

export async function retryJobsByRequestId(requestId: string) {
    const jobs = await db
        .update(jobsTable)
        .set({ status: 'waiting-to-process' })
        .where(eq(jobsTable.requestId, requestId))
        .returning()

    if (!jobs) {
        throw new ApiError({
            code: 'not_found',
            message: `Job not found`,
        })
    }

    return jobs
}

export async function retryJobsByIds(ids: string[]) {
    const [job] = await db
        .update(jobsTable)
        .set({ status: 'waiting-to-process' })
        .where(inArray(jobsTable.id, ids))
        .returning()

    if (!job) {
        throw new ApiError({
            code: 'not_found',
            message: `Job not found`,
        })
    }

    return job
}

export async function updateJob(
    id: string,
    data: Partial<Omit<JobWithFormats, 'id'>>,
) {
    const job = await db
        .update(jobsTable)
        .set(data)
        .where(eq(jobsTable.id, id))
        .returning()

    if (!job) {
        throw new ApiError({
            code: 'not_found',
            message: `Job not found`,
        })
    }

    return job
}

export const updateMergedFormatStatus = async (
    id: string,
    status: ConvertFormatStatus,
    tx?: DatabaseType,
) => {
    const database = tx || db

    const mergedFormat = await database
        .update(mergedFormats)
        .set({ status })
        .where(eq(mergedFormats.id, id))
        .returning()

    if (!mergedFormat) {
        throw new ApiError({
            code: 'not_found',
            message: `MergedFormat not found`,
        })
    }

    return mergedFormat
}

export const updateJobStatus = async (
    id: string,
    status: JobStatusSchema,
    tx?: DatabaseType,
) => {
    const database = tx || db

    const job = await database
        .update(jobsTable)
        .set({ status })
        .where(eq(jobsTable.id, id))
        .returning()

    if (!job) {
        throw new ApiError({
            code: 'not_found',
            message: `Job not found`,
        })
    }

    return job
}

export const batchUpdateJobStatus = async (
    ids: string[],
    status: JobStatusSchema,
    tx?: DatabaseType,
) => {
    if (ids.length === 0) return []

    const database = tx || db

    const jobs = await database
        .update(jobsTable)
        .set({ status })
        .where(inArray(jobsTable.id, ids))
        .returning()

    if (jobs.length !== ids.length) {
        const foundIds = new Set(jobs.map((j) => j.id))
        const missing = ids.filter((id) => !foundIds.has(id))
        throw new ApiError({
            code: 'not_found',
            message: `Some job IDs were not found: ${missing.join(', ')}`,
        })
    }

    return jobs
}

export async function upsertMergedFormat(
    jobId: string,
    status: ConvertFormatStatus,
    audioFormatId: string,
    videoFormatId: string,
) {
    const [mergedFormat] = await db
        .insert(mergedFormats)
        .values({
            jobId,
            status,
            audioFormatId,
            videoFormatId,
        })
        .returning()
        .onConflictDoNothing()

    return mergedFormat
}

export async function getMergedFormatById(id: string) {
    const format = await db.query.mergedFormats.findFirst({
        where: eq(mergedFormats.id, id),
        with: {
            audioFormat: true,
            videoFormat: true,
            job: {
                columns: {
                    title: true,
                    id: true,
                },
            },
        },
    })
    if (!format) {
        throw new ApiError({
            code: 'not_found',
            message: `MergedFormat ID ${id} not found`,
        })
    }
    return format
}

export async function setMergedFormatDownloadUrl(
    id: string,
    downloadUrl: string,
) {
    const [link] = await db
        .update(mergedFormats)
        .set({ downloadUrl })
        .where(eq(mergedFormats.id, id))
        .returning()

    if (!link) {
        throw new ApiError({
            code: 'not_found',
            message: `MergedFormat ID ${id} not found`,
        })
    }

    return link
}

export async function getMergedVideoByFormatId(videoFormatId: string) {
    const format = await db.query.formats.findFirst({
        where: eq(formats.id, videoFormatId),
    })
    if (!format) {
        throw new ApiError({
            code: 'not_found',
            message: `Format with id ${videoFormatId} not found`,
        })
    }
    const link = await db.query.mergedFormats.findFirst({
        where: and(eq(mergedFormats.videoFormatId, format.id)),
    })
    return link
}

export async function getItemsInQueueCount() {
    const [count] = await db
        .select({
            count: sql<number>`COUNT(*)`,
        })
        .from(jobsTable)
        .leftJoin(mergedFormats, eq(jobsTable.id, mergedFormats.jobId))
        .where(
            or(
                eq(jobsTable.status, 'processing'),
                eq(jobsTable.status, 'queued-processing'),
                and(
                    isNotNull(mergedFormats.status),
                    or(
                        eq(mergedFormats.status, 'converting'),
                        eq(mergedFormats.status, 'queued-converting'),
                    ),
                ),
            ),
        )

    return count?.count || 0
}

export async function findNextJobToEnqueue() {
    const [job] = await db
        .select({
            jobId: jobsTable.id,
            jobStatus: jobsTable.status,
            mergedFormatId: mergedFormats.id,
            mergedFormatStatus: mergedFormats.status,
        })
        .from(jobsTable)
        .leftJoin(mergedFormats, eq(jobsTable.id, mergedFormats.jobId))
        .where(
            or(
                eq(jobsTable.status, 'waiting-to-process'),
                and(
                    isNotNull(mergedFormats.status),
                    eq(mergedFormats.status, 'waiting-to-convert'),
                ),
            ),
        )
    return job
}

export async function getFormatById(formatId: string) {
    const format = await db.query.formats.findFirst({
        where: eq(formats.id, formatId),
    })

    if (!format) {
        throw new ApiError({
            code: 'not_found',
            message: `Format with id ${formatId} not found`,
        })
    }

    return format
}
