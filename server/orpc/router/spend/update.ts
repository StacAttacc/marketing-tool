import { authorized } from '~~/server/orpc/authorized'
import { ORPCError } from '@orpc/server'
import { spend, campaign, channelBudget, budget } from '~~/server/database/schemas'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { tryCatch } from '~~/shared/utils/tryCatch'

const inputSchema = z.object({
  id: z.string().uuid(),
  campaignId: z.string().uuid().optional(),
  amountCents: z.number().int().positive().optional(),
  date: z.string().date().optional(),
})

export default authorized
  .input(inputSchema)
  .handler(async ({ input, context }) => {
    const update: Record<string, unknown> = {}
    if (input.campaignId !== undefined) update.campaignId = input.campaignId
    if (input.amountCents !== undefined) update.amountCents = input.amountCents
    if (input.date !== undefined) update.date = input.date

    if (Object.keys(update).length === 0) {
      throw new ORPCError('BAD_REQUEST', { message: 'No fields to update' })
    }

    if (input.campaignId !== undefined || input.date !== undefined) {
      const current = await context.db
        .select({ campaignId: spend.campaignId, date: spend.date })
        .from(spend)
        .where(eq(spend.id, input.id))
        .limit(1)
        .then(rows => rows[0])

      if (!current) {
        throw new ORPCError('NOT_FOUND', { message: 'Spend not found' })
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
      context.db
        .update(spend)
        .set(update)
        .where(eq(spend.id, input.id))
        .returning(),
    )

    if (error) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to update spend' })
    }
    if (!data.length) {
      throw new ORPCError('NOT_FOUND', { message: 'Spend not found' })
    }

    return { success: true }
  })
