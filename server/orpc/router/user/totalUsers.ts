import { authorized } from '~~/server/orpc/authorized'
import { ORPCError } from '@orpc/server'
import { customer } from '~~/server/database/schemas'
import { tryCatch } from '~~/shared/utils/tryCatch'
import { sql } from 'drizzle-orm'

export default authorized.handler(async ({ context }) => {
  const { data, error } = await tryCatch(
    context.db
      .select({ total: sql<number>`count(*)::int` })
      .from(customer),
  )

  if (error) {
    throw new ORPCError('INTERNAL_SERVER_ERROR')
  }

  return { total: data[0]?.total ?? 0 }
})
