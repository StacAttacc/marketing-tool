import { authorized } from '~~/server/orpc/authorized'
import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { campaign, channelBudget, budget } from '~~/server/database/schemas'
import { tryCatch } from '~~/shared/utils/tryCatch'

export default authorized
  .input(z.object({
    channelBudgetId: z.string().uuid(),
    amountCents: z.number().int().positive(),
    startDate: z.string().date(),
    endDate: z.string().date().optional(),
  }).refine(data => !data.endDate || data.startDate <= data.endDate, {
    message: 'Start date must be on or before end date',
  }))
  .handler(async ({ input, context }) => {
    const period = await context.db
      .select({ startDate: budget.startDate, endDate: budget.endDate })
      .from(channelBudget)
      .innerJoin(budget, eq(channelBudget.budgetId, budget.id))
      .where(eq(channelBudget.id, input.channelBudgetId))
      .limit(1)
      .then(rows => rows[0])

    if (!period) {
      throw new ORPCError('BAD_REQUEST', { message: 'Invalid channel budget ID' })
    }

    if (input.startDate < period.startDate || input.startDate > period.endDate) {
      throw new ORPCError('BAD_REQUEST', {
        message: `Start date must be within the budget period (${period.startDate} – ${period.endDate})`,
      })
    }

    if (input.endDate && (input.endDate < period.startDate || input.endDate > period.endDate)) {
      throw new ORPCError('BAD_REQUEST', {
        message: `End date must be within the budget period (${period.startDate} – ${period.endDate})`,
      })
    }

    const { data, error } = await tryCatch(
      context.db.insert(campaign).values({
        channelBudgetId: input.channelBudgetId,
        amountCents: input.amountCents,
        startDate: input.startDate,
        endDate: input.endDate ?? null,
      }).returning(),
    )

    if (error) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to create campaign entry' })
    }

    if (!data?.[0]) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to create campaign entry' })
    }

    return { campaign: data[0] }
  })
