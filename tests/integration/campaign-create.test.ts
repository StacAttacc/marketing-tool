/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ORPCError, call } from '@orpc/server'
import { createDirectDb } from '../helpers/db'

import { auth } from '~~/server/utils/auth'
import procedure from '~~/server/orpc/router/campaign/create'

vi.mock('~~/server/utils/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}))
vi.mock('~~/server/database/db', () => ({
  getDb: vi.fn(() => ({})),
  getSecondDb: vi.fn(() => ({})),
}))

const CHANNEL_BUDGET_ID = '00000000-0000-4000-8000-000000000001'

const mockSession = { id: 'session-1', userId: 'user-1', expiresAt: new Date(), token: 'tok' }
const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test', emailVerified: true, createdAt: new Date(), updatedAt: new Date() }

const ctx = { headers: new Headers() }

const BUDGET_PERIOD = { startDate: '2024-01-01', endDate: '2024-12-31' }

describe('campaign.create', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue({ session: mockSession, user: mockUser } as any)
  })

  it('rejects when startDate is after endDate', async () => {
    const mockDb = createDirectDb([])

    const err = await call(procedure as any, {
      channelBudgetId: CHANNEL_BUDGET_ID,
      amountCents: 1000,
      startDate: '2024-06-01',
      endDate: '2024-01-01',
    }, { context: { ...ctx, db: mockDb } } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('BAD_REQUEST')
  })

  it('throws BAD_REQUEST when channelBudgetId does not exist', async () => {
    // select returns no rows → period = undefined → BAD_REQUEST
    const mockDb = createDirectDb([[]])

    const err = await call(procedure as any, {
      channelBudgetId: CHANNEL_BUDGET_ID,
      amountCents: 1000,
      startDate: '2024-03-01',
    }, { context: { ...ctx, db: mockDb } } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('BAD_REQUEST')
    expect((err as ORPCError).message).toBe('Invalid channel budget ID')
  })

  it('throws BAD_REQUEST when startDate is before the budget period', async () => {
    const mockDb = createDirectDb([[BUDGET_PERIOD]])

    const err = await call(procedure as any, {
      channelBudgetId: CHANNEL_BUDGET_ID,
      amountCents: 1000,
      startDate: '2023-12-31',
    }, { context: { ...ctx, db: mockDb } } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('BAD_REQUEST')
  })

  it('throws BAD_REQUEST when startDate is after the budget period', async () => {
    const mockDb = createDirectDb([[BUDGET_PERIOD]])

    const err = await call(procedure as any, {
      channelBudgetId: CHANNEL_BUDGET_ID,
      amountCents: 1000,
      startDate: '2025-01-01',
    }, { context: { ...ctx, db: mockDb } } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('BAD_REQUEST')
  })

  it('throws BAD_REQUEST when endDate is outside the budget period', async () => {
    const mockDb = createDirectDb([[BUDGET_PERIOD]])

    const err = await call(procedure as any, {
      channelBudgetId: CHANNEL_BUDGET_ID,
      amountCents: 1000,
      startDate: '2024-06-01',
      endDate: '2025-03-01',
    }, { context: { ...ctx, db: mockDb } } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('BAD_REQUEST')
  })

  it('succeeds when dates are within the budget period', async () => {
    const newCampaign = { id: '00000000-0000-4000-8000-000000000099', channelBudgetId: CHANNEL_BUDGET_ID, amountCents: 1000, startDate: '2024-03-01', endDate: '2024-06-30' }
    const mockDb = createDirectDb([
      [BUDGET_PERIOD], // period lookup
      [newCampaign], // insert returning
    ])

    const result = await call(procedure as any, {
      channelBudgetId: CHANNEL_BUDGET_ID,
      amountCents: 1000,
      startDate: '2024-03-01',
      endDate: '2024-06-30',
    }, { context: { ...ctx, db: mockDb } } as any)

    expect(result).toEqual({ campaign: newCampaign })
  })

  it('succeeds with no endDate when startDate is within the budget period', async () => {
    const newCampaign = { id: '00000000-0000-4000-8000-000000000099', channelBudgetId: CHANNEL_BUDGET_ID, amountCents: 500, startDate: '2024-06-01', endDate: null }
    const mockDb = createDirectDb([
      [BUDGET_PERIOD],
      [newCampaign],
    ])

    const result = await call(procedure as any, {
      channelBudgetId: CHANNEL_BUDGET_ID,
      amountCents: 500,
      startDate: '2024-06-01',
    }, { context: { ...ctx, db: mockDb } } as any)

    expect(result).toEqual({ campaign: newCampaign })
  })
})
