/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ORPCError, call } from '@orpc/server'
import { createDirectDb } from '../helpers/db'

import { auth } from '~~/server/utils/auth'
import procedure from '~~/server/orpc/router/campaign/update'

vi.mock('~~/server/utils/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}))
vi.mock('~~/server/database/db', () => ({
  getDb: vi.fn(() => ({})),
  getSecondDb: vi.fn(() => ({})),
}))

const CAMPAIGN_ID = '00000000-0000-4000-8000-000000000001'
const CHANNEL_BUDGET_ID = '00000000-0000-4000-8000-000000000002'

const mockSession = { id: 'session-1', userId: 'user-1', expiresAt: new Date(), token: 'tok' }
const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test', emailVerified: true, createdAt: new Date(), updatedAt: new Date() }

const ctx = { headers: new Headers() }

const CURRENT_CAMPAIGN = {
  channelBudgetId: CHANNEL_BUDGET_ID,
  startDate: '2024-03-01',
  endDate: '2024-06-30',
}
const BUDGET_PERIOD = { startDate: '2024-01-01', endDate: '2024-12-31' }

describe('campaign.update', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue({ session: mockSession, user: mockUser } as any)
  })

  it('throws BAD_REQUEST when no fields are provided', async () => {
    const mockDb = createDirectDb([])

    const err = await call(procedure as any, { id: CAMPAIGN_ID }, {
      context: { ...ctx, db: mockDb },
    } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('BAD_REQUEST')
    expect((err as ORPCError).message).toBe('No fields to update')
  })

  it('throws NOT_FOUND when campaign does not exist', async () => {
    const mockDb = createDirectDb([[]])

    const err = await call(procedure as any, { id: CAMPAIGN_ID, amountCents: 500 }, {
      context: { ...ctx, db: mockDb },
    } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('NOT_FOUND')
  })

  it('throws BAD_REQUEST when effective startDate is after effective endDate', async () => {
    // current endDate = '2024-06-30', new startDate = '2024-07-01' → start > end
    const mockDb = createDirectDb([
      [CURRENT_CAMPAIGN], // fetch current
      // period fetch is skipped because error is thrown before it
    ])

    const err = await call(procedure as any, {
      id: CAMPAIGN_ID,
      startDate: '2024-07-01',
    }, { context: { ...ctx, db: mockDb } } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('BAD_REQUEST')
    expect((err as ORPCError).message).toBe('Start date must be on or before end date')
  })

  it('throws BAD_REQUEST when effective startDate is outside the budget period', async () => {
    const mockDb = createDirectDb([
      [CURRENT_CAMPAIGN],
      [BUDGET_PERIOD],
    ])

    const err = await call(procedure as any, {
      id: CAMPAIGN_ID,
      startDate: '2023-12-01',
    }, { context: { ...ctx, db: mockDb } } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('BAD_REQUEST')
  })

  it('throws BAD_REQUEST when effective endDate is outside the budget period', async () => {
    const mockDb = createDirectDb([
      [CURRENT_CAMPAIGN],
      [BUDGET_PERIOD],
    ])

    const err = await call(procedure as any, {
      id: CAMPAIGN_ID,
      endDate: '2025-01-15',
    }, { context: { ...ctx, db: mockDb } } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('BAD_REQUEST')
  })

  it('throws BAD_REQUEST when channelBudgetId does not exist', async () => {
    const mockDb = createDirectDb([
      [CURRENT_CAMPAIGN],
      [], // period lookup returns empty
    ])

    const err = await call(procedure as any, {
      id: CAMPAIGN_ID,
      startDate: '2024-04-01',
    }, { context: { ...ctx, db: mockDb } } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('BAD_REQUEST')
    expect((err as ORPCError).message).toBe('Invalid channel budget ID')
  })

  it('succeeds when updated date is within the budget period', async () => {
    const updatedRow = { ...CURRENT_CAMPAIGN, id: CAMPAIGN_ID, startDate: '2024-04-01' }
    const mockDb = createDirectDb([
      [CURRENT_CAMPAIGN],
      [BUDGET_PERIOD],
      [updatedRow],
    ])

    const result = await call(procedure as any, {
      id: CAMPAIGN_ID,
      startDate: '2024-04-01',
    }, { context: { ...ctx, db: mockDb } } as any)

    expect(result).toEqual({ success: true })
  })

  it('succeeds when clearing endDate', async () => {
    const updatedRow = { ...CURRENT_CAMPAIGN, id: CAMPAIGN_ID, endDate: null }
    const mockDb = createDirectDb([
      [CURRENT_CAMPAIGN],
      [BUDGET_PERIOD],
      [updatedRow],
    ])

    const result = await call(procedure as any, {
      id: CAMPAIGN_ID,
      endDate: null,
    }, { context: { ...ctx, db: mockDb } } as any)

    expect(result).toEqual({ success: true })
  })
})
