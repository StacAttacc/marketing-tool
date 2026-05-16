import { authorized } from '~~/server/orpc/authorized'
import { ORPCError } from '@orpc/server'
import { campaign, channelBudget, budget } from '~~/server/database/schemas'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { tryCatch } from '~~/shared/utils/tryCatch'

const inputSchema = z.object({
  id: z.string().uuid(),
  channelBudgetId: z.string().uuid().optional(),
  amountCents: z.number().int().positive().optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().nullable().optional(),
})

export default authorized
  .input(inputSchema)
  .handler(async ({ input, context }) => {
    const update: Record<string, unknown> = {}
    if (input.channelBudgetId !== undefined) update.channelBudgetId = input.channelBudgetId
    if (input.amountCents !== undefined) update.amountCents = input.amountCents
    if (input.startDate !== undefined) update.startDate = input.startDate
    if ('endDate' in input) update.endDate = input.endDate ?? null

    if (Object.keys(update).length === 0) {
      throw new ORPCError('BAD_REQUEST', { message: 'No fields to update' })
    }

    const current = await context.db
      .select({
        channelBudgetId: campaign.channelBudgetId,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
      })
      .from(campaign)
      .where(eq(campaign.id, input.id))
      .limit(1)
      .then(rows => rows[0])

    if (!current) {
      throw new ORPCError('NOT_FOUND', { message: 'Campaign not found' })
    }

    const effectiveChannelBudgetId = input.channelBudgetId ?? current.channelBudgetId
    const effectiveStartDate = input.startDate ?? current.startDate
    const effectiveEndDate = 'endDate' in input ? (input.endDate ?? null) : current.endDate

    if (effectiveEndDate && effectiveStartDate > effectiveEndDate) {
      throw new ORPCError('BAD_REQUEST', { message: 'Start date must be on or before end date' })
    }

    const period = await context.db
      .select({ startDate: budget.startDate, endDate: budget.endDate })
      .from(channelBudget)
      .innerJoin(budget, eq(channelBudget.budgetId, budget.id))
      .where(eq(channelBudget.id, effectiveChannelBudgetId))
      .limit(1)
      .then(rows => rows[0])

    if (!period) {
      throw new ORPCError('BAD_REQUEST', { message: 'Invalid channel budget ID' })
    }

    if (effectiveStartDate < period.startDate || effectiveStartDate > period.endDate) {
      throw new ORPCError('BAD_REQUEST', {
        message: `Start date must be within the budget period (${period.startDate} – ${period.endDate})`,
      })
    }

    if (effectiveEndDate && (effectiveEndDate < period.startDate || effectiveEndDate > period.endDate)) {
      throw new ORPCError('BAD_REQUEST', {
        message: `End date must be within the budget period (${period.startDate} – ${period.endDate})`,
      })
    }

    const { data, error } = await tryCatch(
      context.db
        .update(campaign)
        .set(update)
        .where(eq(campaign.id, input.id))
        .returning(),
    )

    if (error) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to update campaign' })
    }
    if (!data.length) {
      throw new ORPCError('NOT_FOUND', { message: 'Campaign not found' })
    }

    return { success: true }
  })
