import type { InferSelectModel } from 'drizzle-orm'
import { pgTable, uuid, text } from 'drizzle-orm/pg-core'

export const channel = pgTable('channel', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
})

export type Channel = InferSelectModel<typeof channel>
