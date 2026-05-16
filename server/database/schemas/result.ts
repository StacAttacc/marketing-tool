import { integer, pgTable, date, uuid } from 'drizzle-orm/pg-core'
import { campaign } from './campaign'
import type { InferSelectModel } from 'drizzle-orm'

export const result = pgTable('result', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => campaign.id),
  date: date('date').notNull(),
  revenueCents: integer('revenue_cents'),
  usersAcquired: integer('users_acquired'),
})

export type Result = InferSelectModel<typeof result>
