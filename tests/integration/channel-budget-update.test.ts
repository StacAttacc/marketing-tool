/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ORPCError, call } from '@orpc/server'
import { createDirectDb } from '../helpers/db'

import { auth } from '~~/server/utils/auth'
import procedure from '~~/server/orpc/router/channel_budget/update'

vi.mock('~~/server/utils/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}))
vi.mock('~~/server/database/db', () => ({
  getDb: vi.fn(() => ({})),
  getSecondDb: vi.fn(() => ({})),
}))

const CHANNEL_BUDGET_ID = '00000000-0000-4000-8000-000000000001'
const BUDGET_ID = '00000000-0000-4000-8000-000000000002'
const CHANNEL_ID = '00000000-0000-4000-8000-000000000003'

const mockSession = { id: 'session-1', userId: 'user-1', expiresAt: new Date(), token: 'tok' }
const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test', emailVerified: true, createdAt: new Date(), updatedAt: new Date() }

const ctx = { headers: new Headers() }

describe('channel_budget.update', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue({ session: mockSession, user: mockUser } as any)
  })

  it('throws BAD_REQUEST when no fields are provided', async () => {
    const mockDb = createDirectDb([])

    const err = await call(procedure as any, { id: CHANNEL_BUDGET_ID }, {
      context: { ...ctx, db: mockDb },
    } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('BAD_REQUEST')
    expect((err as ORPCError).message).toBe('No fields to update')
  })

  it('throws NOT_FOUND when channel budget does not exist', async () => {
    // select returns [] → rows[0] = undefined → NOT_FOUND
    const mockDb = createDirectDb([[]])

    const err = await call(procedure as any, { id: CHANNEL_BUDGET_ID, allocatedBudgetCents: 3000 }, {
      context: { ...ctx, db: mockDb },
    } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('NOT_FOUND')
  })

  it('throws BAD_REQUEST when new allocation would exceed parent budget', async () => {
    // sibling (5000) + new (8000) = 13000 > 10000
    const mockDb = createDirectDb([
      [{ budgetId: BUDGET_ID }], // select channelBudget → found
      [{ totalBudgetCents: 10000 }], // select parent budget
      [{ total: '5000' }], // select sibling allocations sum
    ])

    const err = await call(procedure as any, { id: CHANNEL_BUDGET_ID, allocatedBudgetCents: 8000 }, {
      context: { ...ctx, db: mockDb },
    } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('BAD_REQUEST')
  })

  it('updates revenueCents only — skips budget cap check entirely', async () => {
    const updatedRow = { id: CHANNEL_BUDGET_ID, budgetId: BUDGET_ID, channelId: CHANNEL_ID, allocatedBudgetCents: 3000, revenueCents: 5000, usersAcquired: null }
    // allocatedBudgetCents not provided → cap check block skipped → only one DB call
    const mockDb = createDirectDb([[updatedRow]])

    const result = await call(procedure as any, { id: CHANNEL_BUDGET_ID, revenueCents: 5000 }, {
      context: { ...ctx, db: mockDb },
    } as any)

    expect(result).toEqual({ channelBudget: updatedRow })
  })

  it('throws NOT_FOUND when row disappears at update time', async () => {
    // revenueCents only → cap check skipped, update returns empty
    const mockDb = createDirectDb([[]])

    const err = await call(procedure as any, { id: CHANNEL_BUDGET_ID, revenueCents: 100 }, {
      context: { ...ctx, db: mockDb },
    } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('NOT_FOUND')
  })

  it('succeeds when allocation stays within budget', async () => {
    // sibling (5000) + new (3000) = 8000 <= 10000
    const updatedRow = { id: CHANNEL_BUDGET_ID, budgetId: BUDGET_ID, channelId: CHANNEL_ID, allocatedBudgetCents: 3000, revenueCents: null, usersAcquired: null }
    const mockDb = createDirectDb([
      [{ budgetId: BUDGET_ID }], // select channelBudget
      [{ totalBudgetCents: 10000 }], // select parent budget
      [{ total: '5000' }], // select sibling sum
      [updatedRow], // update returning
    ])

    const result = await call(procedure as any, { id: CHANNEL_BUDGET_ID, allocatedBudgetCents: 3000 }, {
      context: { ...ctx, db: mockDb },
    } as any)

    expect(result).toEqual({ channelBudget: updatedRow })
  })
})
