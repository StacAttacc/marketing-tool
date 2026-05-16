import { pgTable, uuid, integer, unique } from 'drizzle-orm/pg-core'
import { budget } from './budget'
import { channel } from './channel'
import type { InferSelectModel } from 'drizzle-orm'

export const channelBudget = pgTable('channel_budget', {
  id: uuid('id').primaryKey().defaultRandom(),
  budgetId: uuid('budget_id').notNull().references(() => budget.id),
  channelId: uuid('channel_id').notNull().references(() => channel.id),
  allocatedBudgetCents: integer('allocated_budget_cents').notNull(),
  revenueCents: integer('revenue_cents'),
  usersAcquired: integer('users_acquired'),
}, table => [
  unique().on(table.budgetId, table.channelId),
])

export type ChannelBudget = InferSelectModel<typeof channelBudget>
