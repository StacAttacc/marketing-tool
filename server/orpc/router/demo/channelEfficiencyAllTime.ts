import { authorized } from '~~/server/orpc/authorized'
import { ORPCError } from '@orpc/server'
import { sum, lte, eq } from 'drizzle-orm'
import { channel, channelBudget, campaign, result } from '~~/server/database/schemas'
import { tryCatch } from '~~/shared/utils/tryCatch'

export default authorized
  .handler(async ({ context }) => {
    const { db } = context

    const today = new Date().toISOString().slice(0, 10)

    const { data, error } = await tryCatch(
      db
        .select({
          channelId: channel.id,
          totalRevenueCents: sum(result.revenueCents),
          totalUsersAcquired: sum(result.usersAcquired),
        })
        .from(channel)
        .innerJoin(channelBudget, eq(channelBudget.channelId, channel.id))
        .innerJoin(campaign, eq(campaign.channelBudgetId, channelBudget.id))
        .innerJoin(result, eq(result.campaignId, campaign.id))
        .where(lte(result.date, today))
        .groupBy(channel.id),
    )

    if (error) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to fetch all-time channel efficiency' })
    }

    return {
      channels: data.map(r => ({
        channelId: r.channelId,
        revenuePerUser: Number(r.totalUsersAcquired ?? 0) > 0
          ? Number(r.totalRevenueCents ?? 0) / Number(r.totalUsersAcquired)
          : 0,
      })),
    }
  })
