import { authorized } from '~~/server/orpc/authorized'
import { ORPCError } from '@orpc/server'
import { result } from '~~/server/database/schemas/result'
import { tryCatch } from '~~/shared/utils/tryCatch'
import { desc } from 'drizzle-orm'

export default authorized.handler(async ({ context }) => {
  const { data, error } = await tryCatch(
    context.db
      .select()
      .from(result)
      .orderBy(desc(result.date))
      .limit(500)
      .then(rows => ({
        results: rows.map(r => ({
          id: r.id,
          campaignId: r.campaignId,
          date: r.date,
          revenueCents: r.revenueCents,
          usersAcquired: r.usersAcquired,
        })),
      })))

  if (error) {
    throw new ORPCError('INTERNAL_SERVER_ERROR')
  }

  return data
})
