import { authorized } from '~~/server/orpc/authorized'
import { ORPCError } from '@orpc/server'
import { budget } from '~~/server/database/schemas/budget'
import { desc } from 'drizzle-orm'
import { tryCatch } from '~~/shared/utils/tryCatch'

export default authorized.handler(async ({ context }) => {
  const { data, error } = await tryCatch(
    context.db
      .select()
      .from(budget)
      .orderBy(desc(budget.startDate))
      .limit(500)
      .then(rows => ({
        budgets: rows.map(r => ({
          id: r.id,
          budgetPeriod: r.budgetPeriod,
          totalBudgetCents: r.totalBudgetCents,
          startDate: r.startDate,
          endDate: r.endDate,
        })),
      })))

  if (error) {
    throw new ORPCError('INTERNAL_SERVER_ERROR')
  }

  return data
})
