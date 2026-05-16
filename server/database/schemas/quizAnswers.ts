import { pgEnum, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { customer } from './customer'

export const quizReferralSource = pgEnum('quiz_referral_source', [
  'instagram', 'facebook', 'tiktok', 'reddit', 'discord', 'google', 'someone', 'other',
])

export const quizAnswers = pgTable('quiz_answers', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: text('customer_id').notNull().references(() => customer.id, { onDelete: 'cascade' }),
  referralSource: quizReferralSource('referral_source').default('other'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, table => [
  unique('quiz_answers_customer_id_unique').on(table.customerId),
])
