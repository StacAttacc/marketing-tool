import { authorized } from '~~/server/orpc/authorized'
import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { budgetPrediction, channelPrediction } from '~~/server/database/schemas'
import { tryCatch } from '~~/shared/utils/tryCatch'

export default authorized
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input, context }) => {
    const { db } = context

    const { error } = await tryCatch(
      db.transaction(async (tx) => {
        await tx.delete(channelPrediction).where(eq(channelPrediction.budgetPredictionId, input.id))

        const deleted = await tx
          .delete(budgetPrediction)
          .where(eq(budgetPrediction.id, input.id))
          .returning()

        if (!deleted.length) {
          throw new Error('Budget prediction not found')
        }

        return deleted
      }),
    )

    if (error) {
      if (error.message === 'Budget prediction not found') {
        throw new ORPCError('NOT_FOUND', { message: 'Budget prediction not found' })
      }
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to delete budget prediction' })
    }

    return { success: true }
  })
