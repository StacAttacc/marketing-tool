import { authorized } from '~~/server/orpc/authorized'
import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { result, campaign, channelBudget, budget } from '~~/server/database/schemas'
import { tryCatch } from '~~/shared/utils/tryCatch'

export default authorized
  .input(z.object({
    id: z.string().uuid(),
    campaignId: z.string().uuid().optional(),
    date: z.string().date().optional(),
    revenueCents: z.number().int().min(0).nullable().optional(),
    usersAcquired: z.number().int().min(0).nullable().optional(),
  }))
  .handler(async ({ input, context }) => {
    const update: Record<string, unknown> = {}
    if (input.campaignId !== undefined) update.campaignId = input.campaignId
    if (input.date !== undefined) update.date = input.date
    if (input.revenueCents !== undefined) update.revenueCents = input.revenueCents
    if (input.usersAcquired !== undefined) update.usersAcquired = input.usersAcquired

    if (Object.keys(update).length === 0) {
      throw new ORPCError('BAD_REQUEST', { message: 'No fields to update' })
    }

    if (input.campaignId !== undefined || input.date !== undefined) {
      const current = await context.db
        .select({ campaignId: result.campaignId, date: result.date })
        .from(result)
        .where(eq(result.id, input.id))
        .limit(1)
        .then(rows => rows[0])

      if (!current) {
        throw new ORPCError('NOT_FOUND', { message: 'Result not found' })
      }

      const effectiveCampaignId = input.campaignId ?? current.campaignId
      const effectiveDate = input.date ?? current.date

      const ctx = await context.db
        .select({
          budgetStartDate: budget.startDate,
          budgetEndDate: budget.endDate,
          campaignStartDate: campaign.startDate,
          campaignEndDate: campaign.endDate,
        })
        .from(campaign)
        .innerJoin(channelBudget, eq(campaign.channelBudgetId, channelBudget.id))
        .innerJoin(budget, eq(channelBudget.budgetId, budget.id))
        .where(eq(campaign.id, effectiveCampaignId))
        .limit(1)
        .then(rows => rows[0])

      if (!ctx) {
        throw new ORPCError('BAD_REQUEST', { message: 'Invalid campaign ID' })
      }

      if (effectiveDate < ctx.budgetStartDate || effectiveDate > ctx.budgetEndDate) {
        throw new ORPCError('BAD_REQUEST', {
          message: `Date must be within the budget period (${ctx.budgetStartDate} – ${ctx.budgetEndDate})`,
        })
      }

      if (ctx.campaignEndDate && (effectiveDate < ctx.campaignStartDate || effectiveDate > ctx.campaignEndDate)) {
        throw new ORPCError('BAD_REQUEST', {
          message: `Date must be within the campaign period (${ctx.campaignStartDate} – ${ctx.campaignEndDate})`,
        })
      }
    }

    const { data, error } = await tryCatch(
      context.db.update(result).set(update).where(eq(result.id, input.id)).returning(),
    )

    if (error) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to update result' })
    }

    if (!data?.length) {
      throw new ORPCError('NOT_FOUND', { message: 'Result not found' })
    }

    return { success: true }
  })
