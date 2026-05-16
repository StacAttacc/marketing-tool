import { pgTable, index, text, timestamp, foreignKey, unique, uuid, smallint, date, numeric, integer, boolean, time, uniqueIndex, pgEnum } from 'drizzle-orm/pg-core'

export const activityType = pgEnum('activity_type', ['quiz', 'escapeRoom', 'paint', 'yoga', 'dance', 'laserTag', 'comedy', 'cooking', 'karaoke', 'museum', 'miniGolf', 'bowling', 'arcade', 'boardGames', 'sport', 'other'])
export const assigneeStatus = pgEnum('assignee_status', ['pending', 'confirmed', 'declined', 'cancelled', 'waitlisted'])
export const campaignSendStatus = pgEnum('campaign_send_status', ['pending', 'sent', 'failed'])
export const campaignStatus = pgEnum('campaign_status', ['draft', 'running', 'completed', 'cancelled'])
export const gender = pgEnum('gender', ['male', 'female', 'other'])
export const language = pgEnum('language', ['en', 'fr'])
export const paymentStatus = pgEnum('payment_status', ['pending', 'paid', 'expired', 'refunded'])
export const pricingTier = pgEnum('pricing_tier', ['retail', 'wholesale'])
export const quizActivityType = pgEnum('quiz_activity_type', ['workshops', 'board_games_arcade', 'escape_room', 'museum_art_gallery', 'food_crawl', 'coffee_tea', 'walks_hikes', 'fitness', 'sports', 'trivia_night', 'networking_coworking'])
export const quizAlcohol = pgEnum('quiz_alcohol', ['yes', 'no', 'away'])
export const quizExpectation = pgEnum('quiz_expectation', ['friends', 'professional', 'partner', 'fun', 'not_sure'])
export const quizKids = pgEnum('quiz_kids', ['yes', 'no', 'on_the_way', 'prefer_not_to_say'])
export const quizReferralSource = pgEnum('quiz_referral_source', ['instagram', 'facebook', 'tiktok', 'reddit', 'discord', 'google', 'someone', 'other'])
export const quizRelationshipStatus = pgEnum('quiz_relationship_status', ['single', 'in_relationship', 'married', 'prefer_not_to_say'])
export const quizWorkIndustry = pgEnum('quiz_work_industry', ['technology', 'finance_insurance', 'healthcare_life_sciences', 'education_research', 'government_nonprofit', 'manufacturing_industrial', 'construction_real_estate', 'retail_consumer', 'media_marketing_entertainment', 'transportation_logistics', 'energy_environment', 'professional_services', 'other'])

export const verification = pgTable('verification', {
  id: text().primaryKey().notNull(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
}, table => [
  index('verification_identifier_idx').using('btree', table.identifier.asc().nullsLast().op('text_ops')),
])

export const account = pgTable('account', {
  id: text().primaryKey().notNull(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { mode: 'string' }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { mode: 'string' }),
  scope: text(),
  password: text(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
}, table => [
  index('account_userId_idx').using('btree', table.userId.asc().nullsLast().op('text_ops')),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [user.id],
    name: 'account_user_id_user_id_fk',
  }).onDelete('cascade'),
])

export const session = pgTable('session', {
  id: text().primaryKey().notNull(),
  expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
  token: text().notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull(),
  impersonatedBy: text('impersonated_by'),
}, table => [
  index('session_userId_idx').using('btree', table.userId.asc().nullsLast().op('text_ops')),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [user.id],
    name: 'session_user_id_user_id_fk',
  }).onDelete('cascade'),
  unique('session_token_unique').on(table.token),
])

export const quizAnswers = pgTable('quiz_answers', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: text('user_id').notNull(),
  warmth: smallint().notNull(),
  extroversion: smallint().notNull(),
  leadership: smallint().notNull(),
  directness: smallint().notNull(),
  activityTypes: quizActivityType('activity_types').array().notNull(),
  activitySuggestion: text('activity_suggestion'),
  alcohol: quizAlcohol().notNull(),
  maxBudget: smallint('max_budget').notNull(),
  englishLevel: smallint('english_level').notNull(),
  frenchLevel: smallint('french_level').notNull(),
  workIndustry: quizWorkIndustry('work_industry').notNull(),
  expectations: quizExpectation().array().notNull(),
  relationshipStatus: quizRelationshipStatus('relationship_status').notNull(),
  kids: quizKids().notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  referralSource: quizReferralSource('referral_source').default('other'),
}, table => [
  foreignKey({
    columns: [table.userId],
    foreignColumns: [user.id],
    name: 'quiz_answers_user_id_user_id_fk',
  }).onDelete('cascade'),
  unique('quiz_answers_userId_unique').on(table.userId),
])

export const event = pgTable('event', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  title: text().notNull(),
  activityType: activityType('activity_type').notNull(),
  description: text(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  address: text().notNull(),
  latitude: numeric({ precision: 10, scale: 7 }).notNull(),
  longitude: numeric({ precision: 10, scale: 7 }).notNull(),
  capacity: integer().notNull(),
  customPriceCents: integer('custom_price_cents').notNull(),
  isAlcoholServed: boolean('is_alcohol_served').default(false).notNull(),
  allowPlusOne: boolean('allow_plus_one').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  eventType: text('event_type').notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  language: language().default('fr'),
  publishedAt: timestamp('published_at', { withTimezone: true, mode: 'string' }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true, mode: 'string' }),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  isAutoAssignable: boolean('is_auto_assignable').default(true).notNull(),
  autoAssignMinAge: integer('auto_assign_min_age'),
  autoAssignMaxAge: integer('auto_assign_max_age'),
  wholesalePriceCents: integer('wholesale_price_cents').notNull(),
})

export const eventAssignee = pgTable('event_assignee', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  eventId: uuid('event_id').notNull(),
  userId: text('user_id').notNull(),
  status: assigneeStatus().default('pending').notNull(),
  respondedAt: timestamp('responded_at', { withTimezone: true, mode: 'string' }),
  emailSentAt: timestamp('email_sent_at', { withTimezone: true, mode: 'string' }),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  plusOneAddedAt: timestamp('plus_one_added_at', { withTimezone: true, mode: 'string' }),
  compatibilityScore: integer('compatibility_score').default(0).notNull(),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  smsSentAt: timestamp('sms_sent_at', { withTimezone: true, mode: 'string' }),
  feedbackEmailSentAt: timestamp('feedback_email_sent_at', { withTimezone: true, mode: 'string' }),
  reminderEmailSentAt: timestamp('reminder_email_sent_at', { withTimezone: true, mode: 'string' }),
  reminderSmsSentAt: timestamp('reminder_sms_sent_at', { withTimezone: true, mode: 'string' }),
}, table => [
  uniqueIndex('event_assignee_event_user_idx').using('btree', table.eventId.asc().nullsLast().op('text_ops'), table.userId.asc().nullsLast().op('text_ops')),
  index('event_assignee_status_idx').using('btree', table.status.asc().nullsLast().op('enum_ops')),
  foreignKey({
    columns: [table.eventId],
    foreignColumns: [event.id],
    name: 'event_assignee_event_id_event_id_fk',
  }).onDelete('cascade'),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [user.id],
    name: 'event_assignee_user_id_user_id_fk',
  }).onDelete('cascade'),
])

export const user = pgTable('user', {
  id: text().primaryKey().notNull(),
  name: text().notNull(),
  email: text().notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text(),
  language: language().default('fr').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  completedQuizAt: timestamp('completed_quiz_at', { mode: 'string' }),
  role: text(),
  banned: boolean().default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires', { mode: 'string' }),
  phoneNumber: text('phone_number'),
  birthDate: date('birth_date'),
  gender: gender(),
  signupReminderCount: integer('signup_reminder_count').default(0).notNull(),
  lastSignupReminderSentAt: timestamp('last_signup_reminder_sent_at', { mode: 'string' }),
  promoEmailsOptOut: boolean('promo_emails_opt_out').default(false).notNull(),
  ambassadorCode: text('ambassador_code'),
  referredByAmbassadorId: text('referred_by_ambassador_id'),
  referredAt: timestamp('referred_at', { mode: 'string' }),
}, table => [
  index('user_referred_by_ambassador_id_idx').using('btree', table.referredByAmbassadorId.asc().nullsLast().op('text_ops')),
  foreignKey({
    columns: [table.referredByAmbassadorId],
    foreignColumns: [table.id],
    name: 'user_referred_by_ambassador_id_user_id_fk',
  }).onDelete('set null'),
  unique('user_email_unique').on(table.email),
  unique('user_ambassador_code_unique').on(table.ambassadorCode),
])

export const stripeCustomer = pgTable('stripe_customer', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: text('user_id').notNull(),
  stripeCustomerId: text('stripe_customer_id').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
}, table => [
  index('stripe_customer_user_id_idx').using('btree', table.userId.asc().nullsLast().op('text_ops')),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [user.id],
    name: 'stripe_customer_user_id_user_id_fk',
  }).onDelete('cascade'),
  unique('stripe_customer_userId_unique').on(table.userId),
  unique('stripe_customer_stripeCustomerId_unique').on(table.stripeCustomerId),
])

export const eventFeedback = pgTable('event_feedback', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  eventId: uuid('event_id').notNull(),
  userId: text('user_id').notNull(),
  rating: integer(),
  comment: text(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
}, table => [
  index('event_feedback_event_idx').using('btree', table.eventId.asc().nullsLast().op('uuid_ops')),
  uniqueIndex('event_feedback_event_user_idx').using('btree', table.eventId.asc().nullsLast().op('text_ops'), table.userId.asc().nullsLast().op('text_ops')),
  index('event_feedback_user_idx').using('btree', table.userId.asc().nullsLast().op('text_ops')),
  foreignKey({
    columns: [table.eventId],
    foreignColumns: [event.id],
    name: 'event_feedback_event_id_event_id_fk',
  }).onDelete('cascade'),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [user.id],
    name: 'event_feedback_user_id_user_id_fk',
  }).onDelete('cascade'),
])

export const campaignUsers = pgTable('campaign_users', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  campaignId: uuid('campaign_id').notNull(),
  userId: text('user_id').notNull(),
  assignedAt: timestamp('assigned_at', { mode: 'string' }).defaultNow().notNull(),
  assignedByUserId: text('assigned_by_user_id').notNull(),
  sendStatus: campaignSendStatus('send_status').default('pending').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true, mode: 'string' }),
  providerMessageId: text('provider_message_id'),
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
}, table => [
  index('campaign_users_campaign_id_idx').using('btree', table.campaignId.asc().nullsLast().op('uuid_ops')),
  uniqueIndex('campaign_users_campaign_user_idx').using('btree', table.campaignId.asc().nullsLast().op('text_ops'), table.userId.asc().nullsLast().op('text_ops')),
  index('campaign_users_send_status_idx').using('btree', table.sendStatus.asc().nullsLast().op('enum_ops')),
  foreignKey({
    columns: [table.campaignId],
    foreignColumns: [campaigns.id],
    name: 'campaign_users_campaign_id_campaigns_id_fk',
  }).onDelete('cascade'),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [user.id],
    name: 'campaign_users_user_id_user_id_fk',
  }).onDelete('cascade'),
  foreignKey({
    columns: [table.assignedByUserId],
    foreignColumns: [user.id],
    name: 'campaign_users_assigned_by_user_id_user_id_fk',
  }),
])

export const campaigns = pgTable('campaigns', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  name: text().notNull(),
  smsBody: text('sms_body').notNull(),
  status: campaignStatus().default('draft').notNull(),
  createdByUserId: text('created_by_user_id').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  runStartedAt: timestamp('run_started_at', { withTimezone: true, mode: 'string' }),
  runCompletedAt: timestamp('run_completed_at', { withTimezone: true, mode: 'string' }),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
}, table => [
  index('campaign_created_at_idx').using('btree', table.createdAt.asc().nullsLast().op('timestamp_ops')),
  index('campaign_status_idx').using('btree', table.status.asc().nullsLast().op('enum_ops')),
  foreignKey({
    columns: [table.createdByUserId],
    foreignColumns: [user.id],
    name: 'campaigns_created_by_user_id_user_id_fk',
  }),
])

export const eventPayment = pgTable('event_payment', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  eventAssigneeId: uuid('event_assignee_id').notNull(),
  eventId: uuid('event_id').notNull(),
  userId: text('user_id').notNull(),
  stripeCheckoutSessionId: text('stripe_checkout_session_id').notNull(),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  ticketCount: integer('ticket_count').notNull(),
  status: paymentStatus().default('pending').notNull(),
  wholesaleSubtotalCents: integer('wholesale_subtotal_cents').notNull(),
  customSubtotalCents: integer('custom_subtotal_cents').notNull(),
  discountCents: integer('discount_cents').notNull(),
  serviceFeeCents: integer('service_fee_cents').notNull(),
  gstCents: integer('gst_cents').notNull(),
  qstCents: integer('qst_cents').notNull(),
  totalCents: integer('total_cents').notNull(),
  currency: text().default('cad').notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true, mode: 'string' }),
  refundedAt: timestamp('refunded_at', { withTimezone: true, mode: 'string' }),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  pricingTier: pricingTier('pricing_tier').default('retail').notNull(),
}, table => [
  index('event_payment_assignee_idx').using('btree', table.eventAssigneeId.asc().nullsLast().op('uuid_ops')),
  uniqueIndex('event_payment_checkout_session_idx').using('btree', table.stripeCheckoutSessionId.asc().nullsLast().op('text_ops')),
  index('event_payment_payment_intent_idx').using('btree', table.stripePaymentIntentId.asc().nullsLast().op('text_ops')),
  index('event_payment_status_idx').using('btree', table.status.asc().nullsLast().op('enum_ops')),
  foreignKey({
    columns: [table.eventAssigneeId],
    foreignColumns: [eventAssignee.id],
    name: 'event_payment_event_assignee_id_event_assignee_id_fk',
  }).onDelete('cascade'),
  foreignKey({
    columns: [table.eventId],
    foreignColumns: [event.id],
    name: 'event_payment_event_id_event_id_fk',
  }).onDelete('cascade'),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [user.id],
    name: 'event_payment_user_id_user_id_fk',
  }).onDelete('cascade'),
])
