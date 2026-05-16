import { authorized } from '~~/server/orpc/authorized'
import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { eq, asc, desc, count, and, ilike, gte, lte } from 'drizzle-orm'
import { budget, channelBudget, spend, channel, campaign } from '~~/server/database/schemas'
import { tryCatch } from '~~/shared/utils/tryCatch'

const sortBySchema = z.enum(['date', 'amountCents', 'channel'])

export default authorized
  .input(
    z.object({
      search: z.string().max(100).optional(),
      searchField: z.enum(['channel', 'date', 'budgetPeriod']).optional().default('channel'),
      sortBy: sortBySchema.optional().default('date'),
      sortDirection: z.enum(['asc', 'desc']).optional().default('desc'),
      limit: z.number().int().min(1).max(100).default(20),
      offset: z.number().int().min(0).default(0),
      budgetId: z.string().uuid().optional(),
      channelId: z.string().uuid().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }),
  )
  .handler(async ({ context, input }) => {
    const { db } = context
    const { search, searchField, sortBy, sortDirection, limit, offset, budgetId, channelId, startDate, endDate } = input

    const orderFn = sortDirection === 'asc' ? asc : desc

    const sortColumnMap = {
      date: spend.date,
      amountCents: spend.amountCents,
      channel: channel.name,
    }

    const sortColumn = sortColumnMap[sortBy]

    const searchCondition = search && searchField
      ? searchField === 'channel'
        ? ilike(channel.name, `%${search}%`)
        : searchField === 'budgetPeriod'
          ? ilike(budget.budgetPeriod, `%${search}%`)
          : searchField === 'date'
            ? eq(spend.date, search)
            : undefined
      : undefined

    const whereClause = and(
      searchCondition,
      budgetId ? eq(channelBudget.budgetId, budgetId) : undefined,
      channelId ? eq(channelBudget.channelId, channelId) : undefined,
      startDate ? gte(spend.date, startDate) : undefined,
      endDate ? lte(spend.date, endDate) : undefined,
    )

    let query = db
      .select({
        id: spend.id,
        amountCents: spend.amountCents,
        date: spend.date,
        campaignId: spend.campaignId,
        channelId: channelBudget.channelId,
        channelName: channel.name,
        budgetId: channelBudget.budgetId,
        budgetPeriod: budget.budgetPeriod,
      })
      .from(spend)
      .innerJoin(campaign, eq(spend.campaignId, campaign.id))
      .innerJoin(channelBudget, eq(campaign.channelBudgetId, channelBudget.id))
      .innerJoin(channel, eq(channelBudget.channelId, channel.id))
      .innerJoin(budget, eq(channelBudget.budgetId, budget.id))
      .$dynamic()

    if (whereClause) {
      query = query.where(whereClause)
    }

    let countQuery = db
      .select({ value: count() })
      .from(spend)
      .innerJoin(campaign, eq(spend.campaignId, campaign.id))
      .innerJoin(channelBudget, eq(campaign.channelBudgetId, channelBudget.id))
      .innerJoin(channel, eq(channelBudget.channelId, channel.id))
      .innerJoin(budget, eq(channelBudget.budgetId, budget.id))
      .$dynamic()

    if (whereClause) {
      countQuery = countQuery.where(whereClause)
    }

    const { data: spends, error: spendsError } = await tryCatch(
      query
        .orderBy(orderFn(sortColumn))
        .limit(limit)
        .offset(offset),
    )

    if (spendsError) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to fetch spend' })
    }

    const { data: countResult, error: countError } = await tryCatch(countQuery)

    if (countError) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to fetch count' })
    }

    const total = countResult[0]?.value ?? 0

    return {
      spends,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + spends.length < total,
      },
      sort: {
        sortBy,
        sortDirection,
      },
    }
  })
