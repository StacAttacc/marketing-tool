import { authorized } from '~~/server/orpc/authorized'
import { ORPCError } from '@orpc/server'
import { spend } from '~~/server/database/schemas/spend'
import { tryCatch } from '~~/shared/utils/tryCatch'
import { desc } from 'drizzle-orm'

export default authorized.handler(async ({ context }) => {
  const { data, error } = await tryCatch(
    context.db
      .select()
      .from(spend)
      .orderBy(desc(spend.date))
      .limit(500)
      .then(rows => ({
        spends: rows.map(r => ({
          id: r.id,
          campaignId: r.campaignId,
          amountCents: r.amountCents,
          date: r.date,
        })),
      })))

  if (error) {
    throw new ORPCError('INTERNAL_SERVER_ERROR')
  }

  return data
})
