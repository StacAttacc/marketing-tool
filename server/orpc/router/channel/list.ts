import { authorized } from '~~/server/orpc/authorized'
import { ORPCError } from '@orpc/server'
import { channel } from '~~/server/database/schemas/channel'
import { desc } from 'drizzle-orm'
import { tryCatch } from '~~/shared/utils/tryCatch'

export default authorized.handler(async ({ context }) => {
  const { data, error } = await tryCatch(
    context.db
      .select()
      .from(channel)
      .orderBy(desc(channel.name))
      .limit(500)
      .then(rows => ({
        channels: rows.map(r => ({
          id: r.id,
          name: r.name,
        })),
      })))

  if (error) {
    throw new ORPCError('INTERNAL_SERVER_ERROR')
  }

  return data
})
