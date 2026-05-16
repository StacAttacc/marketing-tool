import { pgTable, uuid, date, integer } from 'drizzle-orm/pg-core'
import { campaign } from './campaign'
import type { InferSelectModel } from 'drizzle-orm'

export const spend = pgTable('spend', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => campaign.id),
  amountCents: integer('amount_cents').notNull(),
  date: date('date').notNull(),
})

export type Spend = InferSelectModel<typeof spend>
