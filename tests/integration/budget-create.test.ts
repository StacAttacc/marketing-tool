/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ORPCError, call } from '@orpc/server'
import { createTransactionDb } from '../helpers/db'

import { auth } from '~~/server/utils/auth'
import procedure from '~~/server/orpc/router/budget/create'

vi.mock('~~/server/utils/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}))
vi.mock('~~/server/database/db', () => ({
  getDb: vi.fn(() => ({})),
  getSecondDb: vi.fn(() => ({})),
}))

const BUDGET_ID = '00000000-0000-4000-8000-000000000001'
const CHANNEL_ID = '00000000-0000-4000-8000-000000000002'

const mockSession = { id: 'session-1', userId: 'user-1', expiresAt: new Date(), token: 'tok' }
const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test', emailVerified: true, createdAt: new Date(), updatedAt: new Date() }

const ctx = { headers: new Headers() }

const BUDGET_ROW = { id: BUDGET_ID, budgetPeriod: 'Q1 2024', totalBudgetCents: 10000, startDate: '2024-01-01', endDate: '2024-12-31' }

describe('budget.create', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue({ session: mockSession, user: mockUser } as any)
  })

  it('rejects when startDate is after endDate', async () => {
    const mockDb = createTransactionDb([])

    const err = await call(procedure as any, {
      budgetPeriod: 'Q1 2024',
      totalBudgetCents: 10000,
      startDate: '2024-12-31',
      endDate: '2024-01-01',
      allocations: [],
    }, { context: { ...ctx, db: mockDb } } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('BAD_REQUEST')
  })

  it('succeeds with no allocations', async () => {
    const mockDb = createTransactionDb([
      [BUDGET_ROW], // insert budget returning
    ])

    const result = await call(procedure as any, {
      budgetPeriod: 'Q1 2024',
      totalBudgetCents: 10000,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      allocations: [],
    }, { context: { ...ctx, db: mockDb } } as any)

    expect(result).toEqual({ budget: BUDGET_ROW })
  })

  it('throws when total allocations exceed totalBudgetCents', async () => {
    const mockDb = createTransactionDb([
      [BUDGET_ROW], // insert budget returning
    ])

    const err = await call(procedure as any, {
      budgetPeriod: 'Q1 2024',
      totalBudgetCents: 1000,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      allocations: [{ channelId: CHANNEL_ID, allocatedBudgetCents: 2000 }],
    }, { context: { ...ctx, db: mockDb } } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('BAD_REQUEST')
  })

  it('throws BAD_REQUEST when a channelId does not exist', async () => {
    const mockDb = createTransactionDb([
      [BUDGET_ROW], // insert budget
      [], // channel check: found.length (0) !== channelIds.length (1)
    ])

    const err = await call(procedure as any, {
      budgetPeriod: 'Q1 2024',
      totalBudgetCents: 10000,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      allocations: [{ channelId: CHANNEL_ID, allocatedBudgetCents: 500 }],
    }, { context: { ...ctx, db: mockDb } } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('BAD_REQUEST')
  })

  it('succeeds with valid allocations within budget', async () => {
    const mockDb = createTransactionDb([
      [BUDGET_ROW], // insert budget returning
      [{ id: CHANNEL_ID }], // channel validation: found all channels
      [], // insert channelBudget
    ])

    const result = await call(procedure as any, {
      budgetPeriod: 'Q1 2024',
      totalBudgetCents: 10000,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      allocations: [{ channelId: CHANNEL_ID, allocatedBudgetCents: 3000 }],
    }, { context: { ...ctx, db: mockDb } } as any)

    expect(result).toEqual({ budget: BUDGET_ROW })
  })

  it('skips zero-amount allocations', async () => {
    // allocatedBudgetCents: 0 filtered out → no channel check, no channelBudget insert
    const mockDb = createTransactionDb([
      [BUDGET_ROW],
    ])

    const result = await call(procedure as any, {
      budgetPeriod: 'Q1 2024',
      totalBudgetCents: 10000,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      allocations: [{ channelId: CHANNEL_ID, allocatedBudgetCents: 0 }],
    }, { context: { ...ctx, db: mockDb } } as any)

    expect(result).toEqual({ budget: BUDGET_ROW })
  })
})
