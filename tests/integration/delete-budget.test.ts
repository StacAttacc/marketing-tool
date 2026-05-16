/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ORPCError, call } from '@orpc/server'
import { createTransactionDb } from '../helpers/db'

import { auth } from '~~/server/utils/auth'
import procedure from '~~/server/orpc/router/budget/deleteBudget'

vi.mock('~~/server/utils/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}))
vi.mock('~~/server/database/db', () => ({
  getDb: vi.fn(() => ({})),
  getSecondDb: vi.fn(() => ({})),
}))

const BUDGET_ID = '00000000-0000-4000-8000-000000000001'
const CHANNEL_BUDGET_ID_1 = '00000000-0000-4000-8000-000000000002'
const CHANNEL_BUDGET_ID_2 = '00000000-0000-4000-8000-000000000003'
const CAMPAIGN_ID = '00000000-0000-4000-8000-000000000004'

const mockSession = { id: 'session-1', userId: 'user-1', expiresAt: new Date(), token: 'tok' }
const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test', emailVerified: true, createdAt: new Date(), updatedAt: new Date() }

const ctx = { headers: new Headers() }

describe('budget.deleteBudget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue({ session: mockSession, user: mockUser } as any)
  })

  it('throws NOT_FOUND when budget does not exist', async () => {
    const mockDb = createTransactionDb([
      [], // select channelBudgets → none
      [], // delete budget returning → not found
    ])

    const err = await call(procedure as any, { id: BUDGET_ID }, {
      context: { ...ctx, db: mockDb },
    } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('NOT_FOUND')
  })

  it('deletes cleanly when budget has no channel budgets', async () => {
    const mockDb = createTransactionDb([
      [], // select channelBudgets → none (cascade block skipped)
      [{ id: BUDGET_ID }], // delete budget returning → found
    ])

    const result = await call(procedure as any, { id: BUDGET_ID }, {
      context: { ...ctx, db: mockDb },
    } as any)

    expect(result).toEqual({ success: true })
  })

  it('skips spend/result/campaign deletes when channel budgets have no campaigns', async () => {
    const mockDb = createTransactionDb([
      [{ id: CHANNEL_BUDGET_ID_1 }], // select channelBudgets → 1 found
      [], // select campaigns → none (inner cascade block skipped)
      [], // delete channelBudget
      [{ id: BUDGET_ID }], // delete budget returning
    ])

    const result = await call(procedure as any, { id: BUDGET_ID }, {
      context: { ...ctx, db: mockDb },
    } as any)

    expect(result).toEqual({ success: true })
  })

  it('cascades delete through channelBudgets, campaigns, spend, and results', async () => {
    const mockDb = createTransactionDb([
      [{ id: CHANNEL_BUDGET_ID_1 }, { id: CHANNEL_BUDGET_ID_2 }], // select channelBudgets
      [{ id: CAMPAIGN_ID }], // select campaigns
      [], // delete spend
      [], // delete result
      [], // delete campaign
      [], // delete channelBudget
      [{ id: BUDGET_ID }], // delete budget returning
    ])

    const result = await call(procedure as any, { id: BUDGET_ID }, {
      context: { ...ctx, db: mockDb },
    } as any)

    expect(result).toEqual({ success: true })
  })
})
