import { authorized } from '~~/server/orpc/authorized'
import { ORPCError } from '@orpc/server'
import { channelBudget } from '~~/server/database/schemas/channelBudget'
import { tryCatch } from '~~/shared/utils/tryCatch'

export default authorized.handler(async ({ context }) => {
  const { data, error } = await tryCatch(
    context.db
      .select()
      .from(channelBudget)
      .then(rows => ({
        channelBudgets: rows.map(r => ({
          id: r.id,
          budgetId: r.budgetId,
          channelId: r.channelId,
          allocatedBudgetCents: r.allocatedBudgetCents,
          revenueCents: r.revenueCents,
          usersAcquired: r.usersAcquired,
        })),
      })))

  if (error) {
    throw new ORPCError('INTERNAL_SERVER_ERROR')
  }

  return data
})
