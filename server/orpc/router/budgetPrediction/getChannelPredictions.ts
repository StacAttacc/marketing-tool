import { authorized } from '~~/server/orpc/authorized'
import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { channelPrediction, channel } from '~~/server/database/schemas'
import { tryCatch } from '~~/shared/utils/tryCatch'

export default authorized
  .input(z.object({ budgetPredictionId: z.string().uuid() }))
  .handler(async ({ context, input }) => {
    const { db } = context

    const { data, error } = await tryCatch(
      db
        .select({
          id: channelPrediction.id,
          channelId: channelPrediction.channelId,
          channelName: channel.name,
          allocatedBudgetCents: channelPrediction.allocatedBudgetCents,
          predictedRevenueCents: channelPrediction.predictedRevenueCents,
          predictedUsersAcquired: channelPrediction.predictedUsersAcquired,
        })
        .from(channelPrediction)
        .innerJoin(channel, eq(channel.id, channelPrediction.channelId))
        .where(eq(channelPrediction.budgetPredictionId, input.budgetPredictionId)),
    )

    if (error) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to fetch channel predictions' })
    }

    return { channels: data }
  })
