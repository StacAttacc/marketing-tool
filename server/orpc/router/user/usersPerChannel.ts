import { authorized } from '~~/server/orpc/authorized'
import { ORPCError } from '@orpc/server'
import { user, quizAnswers } from '~~/server/database/schemas-second/schema'
import { tryCatch } from '~~/shared/utils/tryCatch'
import { sql, eq } from 'drizzle-orm'

const referralToChannel: Record<string, string> = {
  google: 'Google Ads',
  instagram: 'Meta Ads',
  facebook: 'Meta Ads',
  tiktok: 'TikTok Ads',
  someone: 'Affiliate Marketing',
  reddit: 'Organic Search',
  discord: 'Organic Search',
}

export default authorized.handler(async ({ context }) => {
  const { data, error } = await tryCatch(
    context.secondDb
      .select({
        date: sql<string>`DATE(${user.createdAt})::text`,
        referralSource: quizAnswers.referralSource,
        count: sql<number>`count(*)::int`,
      })
      .from(user)
      .leftJoin(quizAnswers, eq(quizAnswers.userId, user.id))
      .groupBy(sql`DATE(${user.createdAt})`, quizAnswers.referralSource)
      .orderBy(sql`DATE(${user.createdAt})`),
  )

  if (error) {
    throw new ORPCError('INTERNAL_SERVER_ERROR')
  }

  const byDay = data.map(row => ({
    date: row.date,
    channel: row.referralSource ? (referralToChannel[row.referralSource] ?? 'Other') : 'Other',
    count: row.count,
  }))

  return { byDay }
})
