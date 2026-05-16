import { authorized } from '~~/server/orpc/authorized'
import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { asc, desc, count, sum, ilike, eq, and } from 'drizzle-orm'
import { budget, budgetPrediction, channelPrediction } from '~~/server/database/schemas'
import { tryCatch } from '~~/shared/utils/tryCatch'

const sortBySchema = z.enum(['predictionPeriod', 'totalBudgetCents'])

export default authorized
  .input(
    z.object({
      search: z.string().max(100).optional(),
      searchField: z.enum(['predictionPeriod', 'budgetPeriod']).optional().default('predictionPeriod'),
      sortBy: sortBySchema.optional().default('predictionPeriod'),
      sortDirection: z.enum(['asc', 'desc']).optional().default('asc'),
      limit: z.number().int().min(1).max(100).default(20),
      offset: z.number().int().min(0).default(0),
      budgetId: z.string().uuid().optional(),
    }),
  )
  .handler(async ({ context, input }) => {
    const { db } = context
    const { search, searchField, sortBy, sortDirection, limit, offset, budgetId } = input

    const orderFn = sortDirection === 'asc' ? asc : desc

    const sortColumnMap = {
      predictionPeriod: budgetPrediction.predictionPeriod,
      totalBudgetCents: budgetPrediction.totalBudgetCents,
    }

    const sortColumn = sortColumnMap[sortBy]

    const searchCondition = search
      ? searchField === 'budgetPeriod'
        ? ilike(budget.budgetPeriod, `%${search}%`)
        : ilike(budgetPrediction.predictionPeriod, `%${search}%`)
      : undefined

    const whereClause = and(
      searchCondition,
      budgetId ? eq(budgetPrediction.budgetId, budgetId) : undefined,
    )

    let query = db
      .select({
        id: budgetPrediction.id,
        predictionPeriod: budgetPrediction.predictionPeriod,
        budgetId: budgetPrediction.budgetId,
        budgetPeriod: budget.budgetPeriod,
        totalBudgetCents: budgetPrediction.totalBudgetCents,
        allocatedBudgetCents: sum(channelPrediction.allocatedBudgetCents),
        predictedRevenueCents: sum(channelPrediction.predictedRevenueCents),
        predictedUsersAcquired: sum(channelPrediction.predictedUsersAcquired),
      })
      .from(budgetPrediction)
      .innerJoin(budget, eq(budget.id, budgetPrediction.budgetId))
      .leftJoin(channelPrediction, eq(channelPrediction.budgetPredictionId, budgetPrediction.id))
      .groupBy(
        budgetPrediction.id,
        budgetPrediction.predictionPeriod,
        budgetPrediction.budgetId,
        budget.budgetPeriod,
        budgetPrediction.totalBudgetCents,
      )
      .$dynamic()

    let countQuery = db
      .select({ value: count() })
      .from(budgetPrediction)
      .innerJoin(budget, eq(budget.id, budgetPrediction.budgetId))
      .$dynamic()

    if (whereClause) {
      query = query.where(whereClause)
      countQuery = countQuery.where(whereClause)
    }

    const { data: predictions, error: predictionsError } = await tryCatch(
      query
        .orderBy(orderFn(sortColumn))
        .limit(limit)
        .offset(offset),
    )

    if (predictionsError) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to fetch budget predictions' })
    }

    const { data: countResult, error: countError } = await tryCatch(countQuery)

    if (countError) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to fetch count' })
    }

    const total = countResult[0]?.value ?? 0

    return {
      predictions: predictions.map(p => ({
        ...p,
        allocatedBudgetCents: Number(p.allocatedBudgetCents ?? 0),
        predictedRevenueCents: Number(p.predictedRevenueCents ?? 0),
        predictedUsersAcquired: Number(p.predictedUsersAcquired ?? 0),
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + predictions.length < total,
      },
      sort: {
        sortBy,
        sortDirection,
      },
    }
  })
