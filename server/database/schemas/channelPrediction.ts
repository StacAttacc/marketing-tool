import { pgTable, uuid, integer, unique } from 'drizzle-orm/pg-core'
import { budgetPrediction } from './budgetPrediction'
import { channel } from './channel'
import type { InferSelectModel } from 'drizzle-orm'

export const channelPrediction = pgTable('channel_prediction', {
  id: uuid('id').primaryKey().defaultRandom(),
  budgetPredictionId: uuid('budget_prediction_id').notNull().references(() => budgetPrediction.id),
  channelId: uuid('channel_id').notNull().references(() => channel.id),
  allocatedBudgetCents: integer('allocated_budget_cents').notNull(),
  predictedRevenueCents: integer('predicted_revenue_cents'),
  predictedUsersAcquired: integer('predicted_users_acquired'),
}, table => [
  unique().on(table.budgetPredictionId, table.channelId),
])

export type ChannelPrediction = InferSelectModel<typeof channelPrediction>
