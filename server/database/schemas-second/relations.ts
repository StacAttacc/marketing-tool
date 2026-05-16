import { relations } from 'drizzle-orm/relations'
import { user, account, session, quizAnswers, event, eventAssignee, stripeCustomer, eventFeedback, campaigns, campaignUsers, eventPayment } from './schema'

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

export const userRelations = relations(user, ({ one, many }) => ({
  accounts: many(account),
  sessions: many(session),
  quizAnswers: many(quizAnswers),
  eventAssignees: many(eventAssignee),
  user: one(user, {
    fields: [user.referredByAmbassadorId],
    references: [user.id],
    relationName: 'user_referredByAmbassadorId_user_id',
  }),
  users: many(user, {
    relationName: 'user_referredByAmbassadorId_user_id',
  }),
  stripeCustomers: many(stripeCustomer),
  eventFeedbacks: many(eventFeedback),
  campaignUsers_userId: many(campaignUsers, {
    relationName: 'campaignUsers_userId_user_id',
  }),
  campaignUsers_assignedByUserId: many(campaignUsers, {
    relationName: 'campaignUsers_assignedByUserId_user_id',
  }),
  campaigns: many(campaigns),
  eventPayments: many(eventPayment),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const quizAnswersRelations = relations(quizAnswers, ({ one }) => ({
  user: one(user, {
    fields: [quizAnswers.userId],
    references: [user.id],
  }),
}))

export const eventAssigneeRelations = relations(eventAssignee, ({ one, many }) => ({
  event: one(event, {
    fields: [eventAssignee.eventId],
    references: [event.id],
  }),
  user: one(user, {
    fields: [eventAssignee.userId],
    references: [user.id],
  }),
  eventPayments: many(eventPayment),
}))

export const eventRelations = relations(event, ({ many }) => ({
  eventAssignees: many(eventAssignee),
  eventFeedbacks: many(eventFeedback),
  eventPayments: many(eventPayment),
}))

export const stripeCustomerRelations = relations(stripeCustomer, ({ one }) => ({
  user: one(user, {
    fields: [stripeCustomer.userId],
    references: [user.id],
  }),
}))

export const eventFeedbackRelations = relations(eventFeedback, ({ one }) => ({
  event: one(event, {
    fields: [eventFeedback.eventId],
    references: [event.id],
  }),
  user: one(user, {
    fields: [eventFeedback.userId],
    references: [user.id],
  }),
}))

export const campaignUsersRelations = relations(campaignUsers, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignUsers.campaignId],
    references: [campaigns.id],
  }),
  user_userId: one(user, {
    fields: [campaignUsers.userId],
    references: [user.id],
    relationName: 'campaignUsers_userId_user_id',
  }),
  user_assignedByUserId: one(user, {
    fields: [campaignUsers.assignedByUserId],
    references: [user.id],
    relationName: 'campaignUsers_assignedByUserId_user_id',
  }),
}))

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  campaignUsers: many(campaignUsers),
  user: one(user, {
    fields: [campaigns.createdByUserId],
    references: [user.id],
  }),
}))

export const eventPaymentRelations = relations(eventPayment, ({ one }) => ({
  eventAssignee: one(eventAssignee, {
    fields: [eventPayment.eventAssigneeId],
    references: [eventAssignee.id],
  }),
  event: one(event, {
    fields: [eventPayment.eventId],
    references: [event.id],
  }),
  user: one(user, {
    fields: [eventPayment.userId],
    references: [user.id],
  }),
}))
