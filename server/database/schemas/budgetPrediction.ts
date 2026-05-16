import { pgTable, uuid, integer, text } from 'drizzle-orm/pg-core'
import { budget } from './budget'
import type { InferSelectModel } from 'drizzle-orm'

export const budgetPrediction = pgTable('budget_prediction', {
  id: uuid('id').primaryKey().defaultRandom(),
  predictionPeriod: text('prediction_period').notNull(),
  budgetId: uuid('budget_id').notNull().references(() => budget.id),
  totalBudgetCents: integer('total_budget_cents').notNull(),
})

export type budgetPrediction = InferSelectModel<typeof budgetPrediction>
