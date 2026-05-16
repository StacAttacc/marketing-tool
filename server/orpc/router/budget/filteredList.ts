import { authorized } from '~~/server/orpc/authorized'
import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { asc, desc, count, ilike, lte, gte, and } from 'drizzle-orm'
import { budget } from '~~/server/database/schemas'
import { tryCatch } from '~~/shared/utils/tryCatch'

const sortBySchema = z.enum(['budgetPeriod', 'totalBudgetCents', 'startDate', 'endDate'])

export default authorized
  .input(
    z.object({
      search: z.string().max(100).optional(),
      searchField: z.enum(['budgetPeriod', 'date']).optional().default('budgetPeriod'),
      sortBy: sortBySchema.optional().default('startDate'),
      sortDirection: z.enum(['asc', 'desc']).optional().default('desc'),
      limit: z.number().int().min(1).max(100).default(20),
      offset: z.number().int().min(0).default(0),
    }),
  )
  .handler(async ({ context, input }) => {
    const { db } = context
    const { search, searchField, sortBy, sortDirection, limit, offset } = input

    const orderFn = sortDirection === 'asc' ? asc : desc

    const sortColumnMap = {
      budgetPeriod: budget.budgetPeriod,
      totalBudgetCents: budget.totalBudgetCents,
      startDate: budget.startDate,
      endDate: budget.endDate,
    }

    const sortColumn = sortColumnMap[sortBy]

    let query = db
      .select({
        id: budget.id,
        budgetPeriod: budget.budgetPeriod,
        totalBudgetCents: budget.totalBudgetCents,
        startDate: budget.startDate,
        endDate: budget.endDate,
      })
      .from(budget)
      .$dynamic()

    let countQuery = db
      .select({ value: count() })
      .from(budget)
      .$dynamic()

    if (search) {
      const searchFilter = searchField === 'date'
        ? and(lte(budget.startDate, search), gte(budget.endDate, search))
        : ilike(budget.budgetPeriod, `%${search}%`)
      query = query.where(searchFilter)
      countQuery = countQuery.where(searchFilter)
    }

    const { data: budgets, error: budgetsError } = await tryCatch(
      query
        .orderBy(orderFn(sortColumn))
        .limit(limit)
        .offset(offset),
    )

    if (budgetsError) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to fetch budgets' })
    }

    const { data: countResult, error: countError } = await tryCatch(countQuery)

    if (countError) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to fetch count' })
    }

    const total = countResult[0]?.value ?? 0

    return {
      budgets,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + budgets.length < total,
      },
      sort: {
        sortBy,
        sortDirection,
      },
    }
  })
