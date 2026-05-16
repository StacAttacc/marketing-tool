import { pgTable, uuid, date, integer } from 'drizzle-orm/pg-core'
import { channelBudget } from './channelBudget'
import type { InferSelectModel } from 'drizzle-orm'

export const campaign = pgTable('campaign', {
  id: uuid('id').primaryKey().defaultRandom(),
  channelBudgetId: uuid('channel_budget_id').notNull().references(() => channelBudget.id),
  amountCents: integer('amount_cents').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
})

export type Campaign = InferSelectModel<typeof campaign>
