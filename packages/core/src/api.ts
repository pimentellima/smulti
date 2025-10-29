import { ApiError } from '@/common/errors'
import { FormatDownload, Job, JobWithFormats } from '@/common/types'
import { DownloadStatus, JobStatus } from '@/common/zod'
import { db, type DatabaseType } from '@/db/client'
import { formats, jobs as jobsTable, requests } from '@/db/schema'
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

export async function getJobOrThrow(id: string): Promise<JobWithFormats> {
    const job = await db.query.jobs.findFirst({
        where: eq(jobsTable.id, id),
        with: {
            formats: true,
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

export async function getJobsByRequestId(
    requestId?: string | null,
): Promise<JobWithFormats[]> {
    return await db.query.jobs.findMany({
        with: {
            formats: true,
        },
        where: and(
            eq(jobsTable.requestId, z.string().parse(requestId)),
            not(eq(jobsTable.status, 'cancelled')),
        ),
    })
}

export async function getDownloadByFormatId(
    formatId: string,
): Promise<FormatDownload> {
    const [result] = await db
        .select({
            id: jobsTable.id,
            title: jobsTable.title,
            formatId: formats.id,
            jobId: jobsTable.id,
            requestId: jobsTable.requestId,
            thumbnail: jobsTable.thumbnail,
            downloadStatus: formats.downloadStatus,
            downloadUrl: formats.downloadUrl,
        })
        .from(jobsTable)
        .innerJoin(formats, eq(jobsTable.id, formats.jobId))
        .where(
            and(
                eq(formats.id, formatId),
                not(eq(jobsTable.status, 'cancelled')),
            ),
        )

    return result
}

export async function getDownloadsByRequestId(
    requestId: string,
): Promise<FormatDownload[]> {
    const result = await db
        .select({
            id: jobsTable.id,
            title: jobsTable.title,
            formatId: formats.id,
            jobId: jobsTable.id,
            requestId: jobsTable.requestId,
            thumbnail: jobsTable.thumbnail,
            downloadStatus: formats.downloadStatus,
            downloadUrl: formats.downloadUrl,
        })
        .from(jobsTable)
        .innerJoin(formats, eq(jobsTable.id, formats.jobId))
        .where(
            and(
                eq(jobsTable.requestId, requestId),
                not(eq(jobsTable.status, 'cancelled')),
                isNotNull(formats.downloadStatus),
            ),
        )
    return result
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
    jobs: InferInsertModel<typeof jobsTable>[],
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

export const updateDownloadStatus = async (
    formatId: string,
    downloadStatus: DownloadStatus | null,
) => {
    return await db
        .update(formats)
        .set({ downloadStatus })
        .where(eq(formats.id, formatId))
        .returning()
}

export const updateJobStatus = async (
    id: string,
    status: JobStatus,
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
    status: JobStatus,
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

export async function getItemsInQueueCount() {
    const [count] = await db
        .select({
            count: sql<number>`COUNT(*)`,
        })
        .from(jobsTable)
        .where(
            or(
                eq(jobsTable.status, 'processing'),
                eq(jobsTable.status, 'queued-processing'),
            ),
        )

    return count?.count || 0
}

export async function findJobsWaitingToProcess() {
    return await db
        .select({
            jobId: jobsTable.id,
            jobStatus: jobsTable.status,
        })
        .from(jobsTable)
        .where(eq(jobsTable.status, 'waiting-to-process'))
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

export async function updateFormatDownloadUrl(
    formatId: string,
    downloadUrl: string,
) {
    const format = await db
        .update(formats)
        .set({ downloadUrl })
        .where(eq(formats.id, formatId))
        .returning()

    return format
}
