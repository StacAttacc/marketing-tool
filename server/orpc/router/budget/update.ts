import { authorized } from '~~/server/orpc/authorized'
import { ORPCError } from '@orpc/server'
import { budget, channelBudget } from '~~/server/database/schemas'
import { eq, and, sum, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { tryCatch } from '~~/shared/utils/tryCatch'

const inputSchema = z.object({
  id: z.string().uuid(),
  budgetPeriod: z.string().min(1).max(100).optional(),
  totalBudgetCents: z.number().int().positive().optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  allocations: z.array(z.object({
    channelId: z.string().uuid(),
    allocatedBudgetCents: z.number().int().min(0),
  })).optional(),
}).refine(data => !data.startDate || !data.endDate || data.startDate <= data.endDate, {
  message: 'Start date must be on or before end date',
  path: ['endDate'],
})

export default authorized
  .input(inputSchema)
  .handler(async ({ input, context }) => {
    const { db } = context

    const { data: result, error } = await tryCatch(
      db.transaction(async (tx) => {
        const update: Record<string, unknown> = {}
        if (input.budgetPeriod !== undefined) update.budgetPeriod = input.budgetPeriod
        if (input.totalBudgetCents !== undefined) update.totalBudgetCents = input.totalBudgetCents
        if (input.startDate !== undefined) update.startDate = input.startDate
        if (input.endDate !== undefined) update.endDate = input.endDate

        if (Object.keys(update).length > 0) {
          const data = await tx.update(budget).set(update).where(eq(budget.id, input.id)).returning()

          if (!data.length) {
            throw new ORPCError('NOT_FOUND', { message: 'Budget not found' })
          }
        }

        if (input.allocations) {
          const existingAllocations = await tx
            .select()
            .from(channelBudget)
            .where(eq(channelBudget.budgetId, input.id))

          const existingMap = new Map(
            existingAllocations.map(alloc => [alloc.channelId, alloc]),
          )

          const incomingChannelIds = input.allocations.map(a => a.channelId)
          const channelsToRemove = existingAllocations
            .filter(a => !incomingChannelIds.includes(a.channelId))
            .map(a => a.channelId)

          if (channelsToRemove.length > 0) {
            await tx
              .delete(channelBudget)
              .where(and(
                eq(channelBudget.budgetId, input.id),
                inArray(channelBudget.channelId, channelsToRemove),
              ))
          }

          for (const allocation of input.allocations) {
            const existing = existingMap.get(allocation.channelId)

            if (existing) {
              await tx
                .update(channelBudget)
                .set({ allocatedBudgetCents: allocation.allocatedBudgetCents })
                .where(and(
                  eq(channelBudget.budgetId, input.id),
                  eq(channelBudget.channelId, allocation.channelId),
                ))
            }
            else if (allocation.allocatedBudgetCents > 0) {
              await tx.insert(channelBudget).values({
                budgetId: input.id,
                channelId: allocation.channelId,
                allocatedBudgetCents: allocation.allocatedBudgetCents,
              })
            }
          }
        }

        const [currentBudget] = await tx
          .select({ totalBudgetCents: budget.totalBudgetCents })
          .from(budget)
          .where(eq(budget.id, input.id))

        if (!currentBudget) {
          throw new ORPCError('NOT_FOUND', { message: 'Budget not found' })
        }

        const [allocationSum] = await tx
          .select({ total: sum(channelBudget.allocatedBudgetCents) })
          .from(channelBudget)
          .where(eq(channelBudget.budgetId, input.id))

        const totalAllocated = Number(allocationSum?.total ?? 0)

        if (totalAllocated > currentBudget.totalBudgetCents) {
          throw new ORPCError('BAD_REQUEST', { message: 'Allocated channel budgets exceed total budget' })
        }

        return { success: true }
      }),
    )

    if (error) {
      if (error instanceof ORPCError) {
        throw error
      }
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to update budget' })
    }

    if (!result) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to update budget' })
    }

    return result
  })
