import { authorized } from '~~/server/orpc/authorized'
import { ORPCError } from '@orpc/server'
import { customer, quizAnswers } from '~~/server/database/schemas'
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
    context.db
      .select({
        date: sql<string>`DATE(${customer.createdAt})::text`,
        referralSource: quizAnswers.referralSource,
        count: sql<number>`count(*)::int`,
      })
      .from(customer)
      .leftJoin(quizAnswers, eq(quizAnswers.customerId, customer.id))
      .groupBy(sql`DATE(${customer.createdAt})`, quizAnswers.referralSource)
      .orderBy(sql`DATE(${customer.createdAt})`),
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
