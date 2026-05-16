import { authorized } from '~~/server/orpc/authorized'
import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { budget, channelBudget, channel } from '~~/server/database/schemas'
import { inArray } from 'drizzle-orm'
import { tryCatch } from '~~/shared/utils/tryCatch'

const inputSchema = z.object({
  budgetPeriod: z.string().min(1).max(100),
  totalBudgetCents: z.number().int().positive(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  allocations: z.array(z.object({
    channelId: z.string().uuid(),
    allocatedBudgetCents: z.number().int().min(0),
  })),
}).refine(data => data.startDate <= data.endDate, {
  message: 'Start date must be on or before end date',
  path: ['endDate'],
})

export default authorized
  .input(inputSchema)
  .handler(async ({ input, context }) => {
    const { db } = context

    const { data: result, error } = await tryCatch(
      db.transaction(async (tx) => {
        const budgetData = await tx.insert(budget).values({
          budgetPeriod: input.budgetPeriod,
          totalBudgetCents: input.totalBudgetCents,
          startDate: input.startDate,
          endDate: input.endDate,
        }).returning()

        if (!budgetData?.[0]) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to create budget' })
        }

        const newBudget = budgetData[0]

        const allocationsToInsert = input.allocations
          .filter(a => a.allocatedBudgetCents > 0)
          .map(a => ({
            budgetId: newBudget.id,
            channelId: a.channelId,
            allocatedBudgetCents: a.allocatedBudgetCents,
          }))

        const totalAllocatedCents = allocationsToInsert.reduce(
          (sum, allocation) => sum + allocation.allocatedBudgetCents,
          0,
        )

        if (totalAllocatedCents > input.totalBudgetCents) {
          throw new ORPCError('BAD_REQUEST', {
            message: 'Allocated channel budgets exceed total budget',
          })
        }

        if (allocationsToInsert.length > 0) {
          const channelIds = allocationsToInsert.map(a => a.channelId)
          const foundChannels = await tx
            .select({ id: channel.id })
            .from(channel)
            .where(inArray(channel.id, channelIds))
          if (foundChannels.length !== channelIds.length) {
            throw new ORPCError('BAD_REQUEST', { message: 'One or more channel IDs are invalid' })
          }
          await tx.insert(channelBudget).values(allocationsToInsert)
        }

        return { budget: newBudget }
      }),
    )

    if (error) {
      if (error instanceof ORPCError) throw error
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to create budget' })
    }

    if (!result) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to create budget' })
    }

    return result
  })
