/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ORPCError, call } from '@orpc/server'
import { createTransactionDb } from '../helpers/db'

import { auth } from '~~/server/utils/auth'
import procedure from '~~/server/orpc/router/budget/update'

vi.mock('~~/server/utils/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}))
vi.mock('~~/server/database/db', () => ({
  getDb: vi.fn(() => ({})),
  getSecondDb: vi.fn(() => ({})),
}))

const BUDGET_ID = '00000000-0000-4000-8000-000000000001'
const CHANNEL_ID = '00000000-0000-4000-8000-000000000002'
const CHANNEL_ID_NEW = '00000000-0000-4000-8000-000000000003'

const mockSession = { id: 'session-1', userId: 'user-1', expiresAt: new Date(), token: 'tok' }
const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test', emailVerified: true, createdAt: new Date(), updatedAt: new Date() }

const ctx = { headers: new Headers() }

describe('budget.update', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue({ session: mockSession, user: mockUser } as any)
  })

  it('rejects when startDate is after endDate', async () => {
    const mockDb = createTransactionDb([])

    const err = await call(procedure as any, {
      id: BUDGET_ID,
      startDate: '2024-12-01',
      endDate: '2024-01-01',
    }, { context: { ...ctx, db: mockDb } } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('BAD_REQUEST')
    expect((err as ORPCError).message).toContain('validation')
  })

  it('throws NOT_FOUND when budget does not exist', async () => {
    // tx.update(budget).returning() → [] (not found)
    const mockDb = createTransactionDb([[]])

    const err = await call(procedure as any, {
      id: BUDGET_ID,
      budgetPeriod: 'Q1 2024',
    }, { context: { ...ctx, db: mockDb } } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('NOT_FOUND')
  })

  it('throws BAD_REQUEST when allocations exceed total budget', async () => {
    const mockDb = createTransactionDb([
      [], // select existing allocations → none
      [], // insert new allocation
      [{ totalBudgetCents: 5000 }], // select current budget
      [{ total: '8000' }], // select allocation sum
    ])

    const err = await call(procedure as any, {
      id: BUDGET_ID,
      allocations: [{ channelId: CHANNEL_ID, allocatedBudgetCents: 8000 }],
    }, { context: { ...ctx, db: mockDb } } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('BAD_REQUEST')
  })

  it('succeeds when allocations are within budget', async () => {
    const mockDb = createTransactionDb([
      [], // select existing allocations → none
      [], // insert new allocation
      [{ totalBudgetCents: 10000 }], // select current budget
      [{ total: '3000' }], // select allocation sum
    ])

    const result = await call(procedure as any, {
      id: BUDGET_ID,
      allocations: [{ channelId: CHANNEL_ID, allocatedBudgetCents: 3000 }],
    }, { context: { ...ctx, db: mockDb } } as any)

    expect(result).toEqual({ success: true })
  })

  it('updates an existing channel allocation (update path, not insert)', async () => {
    const mockDb = createTransactionDb([
      [{ id: 'cb-1', channelId: CHANNEL_ID, allocatedBudgetCents: 3000 }], // existing allocs
      [], // update existing
      [{ totalBudgetCents: 10000 }], // current budget
      [{ total: '5000' }], // sum
    ])

    const result = await call(procedure as any, {
      id: BUDGET_ID,
      allocations: [{ channelId: CHANNEL_ID, allocatedBudgetCents: 5000 }],
    }, { context: { ...ctx, db: mockDb } } as any)

    expect(result).toEqual({ success: true })
  })

  it('removes a channel allocation when excluded from incoming list', async () => {
    const mockDb = createTransactionDb([
      [{ id: 'cb-1', channelId: CHANNEL_ID, allocatedBudgetCents: 3000 }], // existing allocs
      [], // delete removed channel
      [{ totalBudgetCents: 10000 }], // current budget
      [{ total: '0' }], // sum (now empty)
    ])

    const result = await call(procedure as any, {
      id: BUDGET_ID,
      allocations: [],
    }, { context: { ...ctx, db: mockDb } } as any)

    expect(result).toEqual({ success: true })
  })

  it('silently skips a zero-amount allocation for a new channel', async () => {
    // allocatedBudgetCents: 0 → guard prevents insert, no insert DB call fires
    const mockDb = createTransactionDb([
      [], // existing allocs → none
      [{ totalBudgetCents: 10000 }], // current budget
      [{ total: '0' }], // sum
    ])

    const result = await call(procedure as any, {
      id: BUDGET_ID,
      allocations: [{ channelId: CHANNEL_ID_NEW, allocatedBudgetCents: 0 }],
    }, { context: { ...ctx, db: mockDb } } as any)

    expect(result).toEqual({ success: true })
  })

  it('updates budget fields and allocations together', async () => {
    const mockDb = createTransactionDb([
      [{ id: BUDGET_ID, budgetPeriod: 'Q2' }], // update budget fields → found
      [], // existing allocs → none
      [], // insert new alloc
      [{ totalBudgetCents: 10000 }], // current budget
      [{ total: '2000' }], // sum
    ])

    const result = await call(procedure as any, {
      id: BUDGET_ID,
      budgetPeriod: 'Q2',
      allocations: [{ channelId: CHANNEL_ID, allocatedBudgetCents: 2000 }],
    }, { context: { ...ctx, db: mockDb } } as any)

    expect(result).toEqual({ success: true })
  })
})
