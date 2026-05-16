import { authorized } from '~~/server/orpc/authorized'
import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { budget, budgetPrediction, channelPrediction } from '~~/server/database/schemas'
import { tryCatch } from '~~/shared/utils/tryCatch'

export default authorized
  .input(z.object({
    budgetId: z.string().uuid(),
    predictionPeriod: z.string().min(1),
    totalBudgetCents: z.number().int().positive(),
    channels: z.array(z.object({
      channelId: z.string().uuid(),
      allocatedBudgetCents: z.number().int().min(0),
      predictedRevenueCents: z.number().int().min(0).optional(),
      predictedUsersAcquired: z.number().int().min(0).optional(),
    })),
  }))
  .handler(async ({ input, context }) => {
    const { db } = context

    const existingBudget = await db
      .select({ id: budget.id })
      .from(budget)
      .where(eq(budget.id, input.budgetId))
      .limit(1)
      .then(rows => rows[0])

    if (!existingBudget) {
      throw new ORPCError('BAD_REQUEST', { message: 'Budget not found' })
    }

    const channelsToInsert = input.channels.filter(c => c.allocatedBudgetCents > 0)

    const totalAllocatedCents = channelsToInsert.reduce((sum, c) => sum + c.allocatedBudgetCents, 0)

    if (totalAllocatedCents > input.totalBudgetCents) {
      throw new ORPCError('BAD_REQUEST', { message: 'Allocated channel budgets exceed total budget' })
    }

    const { data: result, error } = await tryCatch(
      db.transaction(async (tx) => {
        const [newPrediction] = await tx
          .insert(budgetPrediction)
          .values({
            budgetId: input.budgetId,
            predictionPeriod: input.predictionPeriod,
            totalBudgetCents: input.totalBudgetCents,
          })
          .returning()

        if (!newPrediction) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to create budget prediction' })
        }

        if (channelsToInsert.length > 0) {
          await tx.insert(channelPrediction).values(
            channelsToInsert.map(c => ({
              budgetPredictionId: newPrediction.id,
              channelId: c.channelId,
              allocatedBudgetCents: c.allocatedBudgetCents,
              predictedRevenueCents: c.predictedRevenueCents,
              predictedUsersAcquired: c.predictedUsersAcquired,
            })),
          )
        }

        return { budgetPrediction: newPrediction }
      }),
    )

    if (error || !result) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to create budget prediction' })
    }

    return result
  })
