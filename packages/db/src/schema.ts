import { InferSelectModel, relations } from 'drizzle-orm'
import {
    integer,
    pgEnum,
    pgTable,
    text,
    timestamp,
    unique,
    uuid,
} from 'drizzle-orm/pg-core'

export const jobStatusEnum = pgEnum('job_status', [
    'cancelled',
    'error-processing',
    'waiting-to-process',
    'queued-processing',
    'processing',
    'finished-processing',
])

export const mergedFormatsStatusEnum = pgEnum('merged_formats_status', [
    'waiting-to-convert',
    'error-converting',
    'queued-converting',
    'converting',
    'converted',
])

export const jobs = pgTable('jobs', {
    id: uuid('id').primaryKey().defaultRandom(),
    requestId: uuid('request_id')
        .references(() => requests.id, { onDelete: 'cascade' })
        .notNull(),
    url: text('url').notNull(),
    status: jobStatusEnum('status').notNull(),
    title: text('title'),
})


export const mergedFormats = pgTable(
    'merged_formats',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        status: mergedFormatsStatusEnum('status').notNull(),
        videoFormatId: uuid('video_format_id')
            .references(() => formats.id, {
                onDelete: 'cascade',
            })
            .notNull(),
        audioFormatId: uuid('audio_format_id')
            .references(() => formats.id, {
                onDelete: 'cascade',
            })
            .notNull(),
        jobId: uuid('job_id')
            .references(() => jobs.id, {
                onDelete: 'cascade',
            })
            .notNull(),
        downloadUrl: text('download_url'),
    },
    (table) => ({
        videoAudioUnique: unique().on(table.videoFormatId, table.audioFormatId),
    }),
)

export const formats = pgTable('formats', {
    id: uuid('id').primaryKey().defaultRandom(),
    formatId: text('format_id').notNull(),
    jobId: uuid('job_id')
        .references(() => jobs.id, { onDelete: 'cascade' })
        .notNull(),
    ext: text('ext').notNull(),
    resolution: text('resolution'),
    acodec: text('acodec'),
    vcodec: text('vcodec'),
    filesize: integer('filesize'),
    tbr: text('tbr'),
    url: text('url').notNull(),
    language: text('language'),
    formatNote: text('format_note'),
    createdAt: timestamp('created_at').defaultNow(),
})

export const requests = pgTable('requests', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
})

export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name'),
    email: text('email').unique(),
    emailVerified: timestamp('email_verified', { mode: 'date' }),
    password: text('password').notNull(),
    image: text('image'),
    stripeCustomerId: text('stripe_customer_id').unique(),
    stripeSubscriptionId: text('stripe_subscription_id').unique(),
    createdAt: timestamp('created_at').defaultNow(),
})

export const jobRelations = relations(jobs, ({ many, one }) => ({
    formats: many(formats),
    mergedFormats: many(mergedFormats),
    request: one(requests, {
        fields: [jobs.requestId],
        references: [requests.id],
    }),
}))

export const formatRelations = relations(formats, ({ one }) => ({
    job: one(jobs, {
        fields: [formats.jobId],
        references: [jobs.id],
    }),
}))

export const requestRelations = relations(requests, ({ many, one }) => ({
    user: one(users, {
        fields: [requests.userId],
        references: [users.id],
    }),
    jobs: many(jobs),
}))

export const mergedVideoRelations = relations(mergedFormats, ({ one }) => ({
    videoFormat: one(formats, {
        fields: [mergedFormats.videoFormatId],
        references: [formats.id],
    }),
    audioFormat: one(formats, {
        fields: [mergedFormats.audioFormatId],
        references: [formats.id],
    }),
    job: one(jobs, {
        fields: [mergedFormats.jobId],
        references: [jobs.id],
    }),
}))
