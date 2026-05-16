import { authorized } from '~~/server/orpc/authorized'
import { ORPCError } from '@orpc/server'
import { sum } from 'drizzle-orm'
import { result } from '~~/server/database/schemas'
import { tryCatch } from '~~/shared/utils/tryCatch'

export default authorized
  .handler(async ({ context }) => {
    const { db } = context

    const { data, error } = await tryCatch(
      db.select({ total: sum(result.usersAcquired) }).from(result),
    )

    if (error) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to fetch total users' })
    }

    return {
      totalUsers: Number(data[0]?.total ?? 0),
    }
  })
