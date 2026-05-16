import { authorized } from '~~/server/orpc/authorized'
import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { eq, asc, desc, count, gte, lte, and, ilike } from 'drizzle-orm'
import { budget, channelBudget, campaign, channel } from '~~/server/database/schemas'
import { tryCatch } from '~~/shared/utils/tryCatch'

const sortBySchema = z.enum(['startDate', 'amountCents', 'channel'])

export default authorized
  .input(
    z.object({
      budgetPeriodId: z.string().uuid().optional(),
      search: z.string().max(100).optional(),
      searchField: z.enum(['budgetPeriod', 'channel', 'startDate']).optional(),
      startDate: z.string().date().optional(),
      endDate: z.string().date().optional(),
      sortBy: sortBySchema.optional().default('startDate'),
      sortDirection: z.enum(['asc', 'desc']).optional().default('desc'),
      limit: z.number().int().min(1).max(100).default(20),
      offset: z.number().int().min(0).default(0),
    }),
  )
  .handler(async ({ context, input }) => {
    const { db } = context
    const { budgetPeriodId, search, searchField, startDate, endDate, sortBy, sortDirection, limit, offset } = input

    const orderFn = sortDirection === 'asc' ? asc : desc

    const sortColumnMap = {
      startDate: campaign.startDate,
      amountCents: campaign.amountCents,
      channel: channel.name,
    }

    const sortColumn = sortColumnMap[sortBy]

    const searchCondition = search && searchField
      ? searchField === 'budgetPeriod'
        ? ilike(budget.budgetPeriod, `%${search}%`)
        : searchField === 'channel'
          ? ilike(channel.name, `%${search}%`)
          : searchField === 'startDate'
            ? and(lte(campaign.startDate, search), gte(campaign.endDate, search))
            : undefined
      : undefined

    const whereClause = and(
      budgetPeriodId ? eq(budget.id, budgetPeriodId) : undefined,
      startDate ? gte(campaign.startDate, startDate) : undefined,
      endDate ? lte(campaign.endDate, endDate) : undefined,
      searchCondition,
    )

    let query = db
      .select({
        id: campaign.id,
        amountCents: campaign.amountCents,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        channelBudgetId: campaign.channelBudgetId,
        channelId: channelBudget.channelId,
        channelName: channel.name,
        budgetId: channelBudget.budgetId,
        budgetPeriod: budget.budgetPeriod,
      })
      .from(campaign)
      .innerJoin(channelBudget, eq(campaign.channelBudgetId, channelBudget.id))
      .innerJoin(channel, eq(channelBudget.channelId, channel.id))
      .innerJoin(budget, eq(channelBudget.budgetId, budget.id))
      .$dynamic()

    if (whereClause) {
      query = query.where(whereClause)
    }

    let countQuery = db
      .select({ value: count() })
      .from(campaign)
      .innerJoin(channelBudget, eq(campaign.channelBudgetId, channelBudget.id))
      .innerJoin(channel, eq(channelBudget.channelId, channel.id))
      .innerJoin(budget, eq(channelBudget.budgetId, budget.id))
      .$dynamic()

    if (whereClause) {
      countQuery = countQuery.where(whereClause)
    }

    const { data: campaigns, error: campaignsError } = await tryCatch(
      query
        .orderBy(orderFn(sortColumn))
        .limit(limit)
        .offset(offset),
    )

    if (campaignsError) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to fetch campaigns' })
    }

    const { data: countResult, error: countError } = await tryCatch(countQuery)

    if (countError) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to fetch count' })
    }

    const total = countResult[0]?.value ?? 0

    return {
      campaigns,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + campaigns.length < total,
      },
      sort: {
        sortBy,
        sortDirection,
      },
    }
  })
