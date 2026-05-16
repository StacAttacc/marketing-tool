import { pgTable, uuid, date, integer, text } from 'drizzle-orm/pg-core'
import type { InferSelectModel } from 'drizzle-orm'

export const budget = pgTable('budget', {
  id: uuid('id').primaryKey().defaultRandom(),
  budgetPeriod: text('budget_period').notNull(),
  totalBudgetCents: integer('total_budget_cents').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
})

export type Budget = InferSelectModel<typeof budget>
