import { authorized } from '~~/server/orpc/authorized'
import { ORPCError } from '@orpc/server'
import { user } from '~~/server/database/schemas-second/schema'
import { tryCatch } from '~~/shared/utils/tryCatch'
import { sql } from 'drizzle-orm'

export default authorized.handler(async ({ context }) => {
  const { data, error } = await tryCatch(
    context.secondDb
      .select({ total: sql<number>`count(*)::int` })
      .from(user),
  )

  if (error) {
    throw new ORPCError('INTERNAL_SERVER_ERROR')
  }

  return { total: data[0]?.total ?? 0 }
})
