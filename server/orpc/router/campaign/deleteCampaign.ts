import { authorized } from '~~/server/orpc/authorized'
import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { campaign } from '~~/server/database/schemas'
import { tryCatch } from '~~/shared/utils/tryCatch'

export default authorized
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input, context }) => {
    const { data, error } = await tryCatch(
      context.db.delete(campaign).where(eq(campaign.id, input.id)).returning(),
    )

    if (error) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to delete campaign entry' })
    }

    if (!data?.length) {
      throw new ORPCError('NOT_FOUND', { message: 'Campaign entry not found' })
    }

    return { success: true }
  })
