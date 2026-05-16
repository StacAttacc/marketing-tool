import { authorized } from '~~/server/orpc/authorized'
import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { spend, campaign, channelBudget, budget } from '~~/server/database/schemas'
import { tryCatch } from '~~/shared/utils/tryCatch'

export default authorized
  .input(z.object({
    campaignId: z.string().uuid(),
    amountCents: z.number().int().positive(),
    date: z.string().date(),
  }))
  .handler(async ({ input, context }) => {
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
      .where(eq(campaign.id, input.campaignId))
      .limit(1)
      .then(rows => rows[0])

    if (!ctx) {
      throw new ORPCError('BAD_REQUEST', { message: 'Invalid campaign ID' })
    }

    if (input.date < ctx.budgetStartDate || input.date > ctx.budgetEndDate) {
      throw new ORPCError('BAD_REQUEST', {
        message: `Date must be within the budget period (${ctx.budgetStartDate} – ${ctx.budgetEndDate})`,
      })
    }

    if (ctx.campaignEndDate && (input.date < ctx.campaignStartDate || input.date > ctx.campaignEndDate)) {
      throw new ORPCError('BAD_REQUEST', {
        message: `Date must be within the campaign period (${ctx.campaignStartDate} – ${ctx.campaignEndDate})`,
      })
    }

    const { data, error } = await tryCatch(
      context.db.insert(spend).values({
        campaignId: input.campaignId,
        amountCents: input.amountCents,
        date: input.date,
      }).returning(),
    )

    if (error) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to create spend entry' })
    }

    if (!data?.[0]) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to create spend entry' })
    }

    return { spend: data[0] }
  })
