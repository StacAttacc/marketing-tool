import { authorized } from '~~/server/orpc/authorized'
import { ORPCError } from '@orpc/server'
import { channelBudget } from '~~/server/database/schemas/channelBudget'
import { budget } from '~~/server/database/schemas/budget'
import { and, eq, ne, sum } from 'drizzle-orm'
import { z } from 'zod'
import { tryCatch } from '~~/shared/utils/tryCatch'

const inputSchema = z.object({
  id: z.string().uuid(),
  allocatedBudgetCents: z.number().int().positive().optional(),
  revenueCents: z.number().int().nonnegative().optional(),
  usersAcquired: z.number().int().nonnegative().optional(),
})

export default authorized
  .input(inputSchema)
  .handler(async ({ input, context }) => {
    const update: Record<string, unknown> = {}
    if (input.allocatedBudgetCents !== undefined) update.allocatedBudgetCents = input.allocatedBudgetCents
    if (input.revenueCents !== undefined) update.revenueCents = input.revenueCents
    if (input.usersAcquired !== undefined) update.usersAcquired = input.usersAcquired

    if (Object.keys(update).length === 0) {
      throw new ORPCError('BAD_REQUEST', { message: 'No fields to update' })
    }

    if (input.allocatedBudgetCents !== undefined) {
      const current = await context.db
        .select({ budgetId: channelBudget.budgetId })
        .from(channelBudget)
        .where(eq(channelBudget.id, input.id))
        .limit(1)
        .then(rows => rows[0])

      if (!current) {
        throw new ORPCError('NOT_FOUND', { message: 'ChannelBudget not found' })
      }

      const [budgetRow] = await context.db
        .select({ totalBudgetCents: budget.totalBudgetCents })
        .from(budget)
        .where(eq(budget.id, current.budgetId))

      const [siblingSum] = await context.db
        .select({ total: sum(channelBudget.allocatedBudgetCents) })
        .from(channelBudget)
        .where(and(eq(channelBudget.budgetId, current.budgetId), ne(channelBudget.id, input.id)))

      const otherAllocated = Number(siblingSum?.total ?? 0)
      const newTotal = otherAllocated + input.allocatedBudgetCents

      if (!budgetRow) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Parent budget not found' })
      }

      if (newTotal > budgetRow.totalBudgetCents) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Total allocations would exceed the total budget',
        })
      }
    }

    const { data, error } = await tryCatch(
      context.db
        .update(channelBudget)
        .set(update)
        .where(eq(channelBudget.id, input.id))
        .returning(),
    )

    if (error) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to update channelBudget' })
    }

    if (!data.length) {
      throw new ORPCError('NOT_FOUND', { message: 'ChannelBudget not found' })
    }

    return { channelBudget: data[0] }
  })
