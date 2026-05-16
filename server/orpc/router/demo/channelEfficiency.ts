import { authorized } from '~~/server/orpc/authorized'
import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { eq, sum } from 'drizzle-orm'
import { budget, channelBudget, channel, campaign, spend, result } from '~~/server/database/schemas'
import { tryCatch } from '~~/shared/utils/tryCatch'

export default authorized
  .input(z.object({ budgetId: z.string().uuid() }))
  .handler(async ({ context, input }) => {
    const { db } = context

    const { data: spendRows, error: spendError } = await tryCatch(
      db
        .select({
          channelId: channel.id,
          channelName: channel.name,
          totalSpendCents: sum(spend.amountCents),
          budgetPeriod: budget.budgetPeriod,
        })
        .from(channelBudget)
        .innerJoin(channel, eq(channelBudget.channelId, channel.id))
        .innerJoin(budget, eq(channelBudget.budgetId, budget.id))
        .innerJoin(campaign, eq(campaign.channelBudgetId, channelBudget.id))
        .innerJoin(spend, eq(spend.campaignId, campaign.id))
        .where(eq(channelBudget.budgetId, input.budgetId))
        .groupBy(channel.id, channel.name, budget.budgetPeriod),
    )

    if (spendError) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to fetch spend data' })
    }

    const { data: resultRows, error: resultError } = await tryCatch(
      db
        .select({
          channelId: channel.id,
          totalRevenueCents: sum(result.revenueCents),
          totalUsersAcquired: sum(result.usersAcquired),
        })
        .from(channelBudget)
        .innerJoin(channel, eq(channelBudget.channelId, channel.id))
        .innerJoin(campaign, eq(campaign.channelBudgetId, channelBudget.id))
        .innerJoin(result, eq(result.campaignId, campaign.id))
        .where(eq(channelBudget.budgetId, input.budgetId))
        .groupBy(channel.id),
    )

    if (resultError) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to fetch result data' })
    }

    const resultByChannel = new Map(
      resultRows.map(r => [r.channelId, r]),
    )

    return {
      channels: spendRows.map(r => ({
        channelId: r.channelId,
        channelName: r.channelName,
        totalSpendCents: Number(r.totalSpendCents ?? 0),
        revenueCents: Number(resultByChannel.get(r.channelId)?.totalRevenueCents ?? 0),
        usersAcquired: Number(resultByChannel.get(r.channelId)?.totalUsersAcquired ?? 0),
        budgetPeriod: r.budgetPeriod,
      })),
    }
  })
