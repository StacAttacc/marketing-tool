import { authorized } from '~~/server/orpc/authorized'
import { ORPCError } from '@orpc/server'
import { campaign, channelBudget, channel, budget } from '~~/server/database/schemas'
import { tryCatch } from '~~/shared/utils/tryCatch'
import { eq, desc } from 'drizzle-orm'

export default authorized.handler(async ({ context }) => {
  const { data, error } = await tryCatch(
    context.db
      .select({
        id: campaign.id,
        channelBudgetId: campaign.channelBudgetId,
        amountCents: campaign.amountCents,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        channelId: channelBudget.channelId,
        channelName: channel.name,
        budgetId: channelBudget.budgetId,
        budgetPeriod: budget.budgetPeriod,
      })
      .from(campaign)
      .innerJoin(channelBudget, eq(campaign.channelBudgetId, channelBudget.id))
      .innerJoin(channel, eq(channelBudget.channelId, channel.id))
      .innerJoin(budget, eq(channelBudget.budgetId, budget.id))
      .orderBy(desc(campaign.startDate))
      .limit(500)
      .then(rows => ({ campaigns: rows })),
  )

  if (error) {
    throw new ORPCError('INTERNAL_SERVER_ERROR')
  }

  return data
})
