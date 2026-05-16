import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const customer = pgTable('customer', {
  id: text('id').primaryKey(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
