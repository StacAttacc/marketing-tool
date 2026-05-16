import { authorized } from '~~/server/orpc/authorized'
import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { eq, inArray } from 'drizzle-orm'
import { budget, channelBudget, campaign, spend, result } from '~~/server/database/schemas'
import { tryCatch } from '~~/shared/utils/tryCatch'

export default authorized
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input, context }) => {
    const { db } = context

    const { error } = await tryCatch(
      db.transaction(async (tx) => {
        const channelBudgets = await tx
          .select({ id: channelBudget.id })
          .from(channelBudget)
          .where(eq(channelBudget.budgetId, input.id))

        const channelBudgetIds = channelBudgets.map(cb => cb.id)

        if (channelBudgetIds.length > 0) {
          const campaigns = await tx
            .select({ id: campaign.id })
            .from(campaign)
            .where(inArray(campaign.channelBudgetId, channelBudgetIds))

          const campaignIds = campaigns.map(c => c.id)

          if (campaignIds.length > 0) {
            await tx.delete(spend).where(inArray(spend.campaignId, campaignIds))
            await tx.delete(result).where(inArray(result.campaignId, campaignIds))
            await tx.delete(campaign).where(inArray(campaign.id, campaignIds))
          }

          await tx.delete(channelBudget).where(eq(channelBudget.budgetId, input.id))
        }

        const deleted = await tx.delete(budget).where(eq(budget.id, input.id)).returning()

        if (!deleted.length) {
          throw new ORPCError('NOT_FOUND', { message: 'Budget not found' })
        }

        return deleted
      }),
    )

    if (error) {
      if (error instanceof ORPCError) {
        throw error
      }
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to delete budget' })
    }

    return { success: true }
  })
