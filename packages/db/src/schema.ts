import { InferSelectModel, relations } from 'drizzle-orm'
import {
    integer,
    pgEnum,
    pgTable,
    text,
    timestamp,
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

export const downloadStatusEnum = pgEnum('download_status', [
    'downloading',
    'error-downloading',
    'finished-downloading',
    'waiting-to-download',
    'queued-downloading',
])

export const jobs = pgTable('jobs', {
    id: uuid('id').primaryKey().defaultRandom(),
    requestId: uuid('request_id')
        .references(() => requests.id, { onDelete: 'cascade' })
        .notNull(),
    url: text('url').notNull(),
    status: jobStatusEnum('status').notNull(),
    title: text('title'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
})

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
    downloadUrl: text('download_url'),
    downloadStatus: downloadStatusEnum('download_status'),
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