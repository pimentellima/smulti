import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

export type DatabaseType = PostgresJsDatabase<typeof schema>

const globalForDrizzle = global as unknown as { drizzle?: DatabaseType }
const client = postgres(process.env.DATABASE_URL!)

export const db = globalForDrizzle.drizzle || drizzle(client, { schema })

if (process.env.NODE_ENV !== 'production') {
    globalForDrizzle.drizzle = db
}
