/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ORPCError, call } from '@orpc/server'
import { createDirectDb } from '../helpers/db'

import { auth } from '~~/server/utils/auth'
import procedure from '~~/server/orpc/router/result/create'

vi.mock('~~/server/utils/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}))
vi.mock('~~/server/database/db', () => ({
  getDb: vi.fn(() => ({})),
  getSecondDb: vi.fn(() => ({})),
}))

const CAMPAIGN_ID = '00000000-0000-4000-8000-000000000001'

const mockSession = { id: 'session-1', userId: 'user-1', expiresAt: new Date(), token: 'tok' }
const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test', emailVerified: true, createdAt: new Date(), updatedAt: new Date() }

const ctx = { headers: new Headers() }

const PERIODS = {
  budgetStartDate: '2024-01-01',
  budgetEndDate: '2024-12-31',
  campaignStartDate: '2024-03-01',
  campaignEndDate: '2024-06-30',
}

describe('result.create', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue({ session: mockSession, user: mockUser } as any)
  })

  it('throws BAD_REQUEST when campaignId does not exist', async () => {
    const mockDb = createDirectDb([[]])

    const err = await call(procedure as any, {
      campaignId: CAMPAIGN_ID,
      date: '2024-04-01',
    }, { context: { ...ctx, db: mockDb } } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('BAD_REQUEST')
    expect((err as ORPCError).message).toBe('Invalid campaign ID')
  })

  it('throws BAD_REQUEST when date is before the budget period', async () => {
    const mockDb = createDirectDb([[PERIODS]])

    const err = await call(procedure as any, {
      campaignId: CAMPAIGN_ID,
      date: '2023-12-31',
    }, { context: { ...ctx, db: mockDb } } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('BAD_REQUEST')
  })

  it('throws BAD_REQUEST when date is after the budget period', async () => {
    const mockDb = createDirectDb([[PERIODS]])

    const err = await call(procedure as any, {
      campaignId: CAMPAIGN_ID,
      date: '2025-01-01',
    }, { context: { ...ctx, db: mockDb } } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('BAD_REQUEST')
  })

  it('throws BAD_REQUEST when date is outside the campaign period', async () => {
    const mockDb = createDirectDb([[PERIODS]])

    const err = await call(procedure as any, {
      campaignId: CAMPAIGN_ID,
      date: '2024-07-15',
    }, { context: { ...ctx, db: mockDb } } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('BAD_REQUEST')
  })

  it('does not enforce campaign period when campaign has no endDate', async () => {
    const periodsNoEnd = { ...PERIODS, campaignEndDate: null }
    const newResult = { id: '00000000-0000-4000-8000-000000000099', campaignId: CAMPAIGN_ID, date: '2024-09-01', revenueCents: null, usersAcquired: null }
    const mockDb = createDirectDb([
      [periodsNoEnd],
      [newResult],
    ])

    const result = await call(procedure as any, {
      campaignId: CAMPAIGN_ID,
      date: '2024-09-01',
    }, { context: { ...ctx, db: mockDb } } as any)

    expect(result).toEqual({ result: newResult })
  })

  it('succeeds when date is within both budget and campaign periods', async () => {
    const newResult = { id: '00000000-0000-4000-8000-000000000099', campaignId: CAMPAIGN_ID, date: '2024-04-15', revenueCents: 5000, usersAcquired: 10 }
    const mockDb = createDirectDb([
      [PERIODS],
      [newResult],
    ])

    const result = await call(procedure as any, {
      campaignId: CAMPAIGN_ID,
      date: '2024-04-15',
      revenueCents: 5000,
      usersAcquired: 10,
    }, { context: { ...ctx, db: mockDb } } as any)

    expect(result).toEqual({ result: newResult })
  })
})
