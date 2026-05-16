/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ORPCError, call } from '@orpc/server'
import { createDirectDb } from '../helpers/db'

import { auth } from '~~/server/utils/auth'
import procedure from '~~/server/orpc/router/spend/update'

vi.mock('~~/server/utils/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}))
vi.mock('~~/server/database/db', () => ({
  getDb: vi.fn(() => ({})),
  getSecondDb: vi.fn(() => ({})),
}))

const SPEND_ID = '00000000-0000-4000-8000-000000000001'
const CAMPAIGN_ID = '00000000-0000-4000-8000-000000000002'

const mockSession = { id: 'session-1', userId: 'user-1', expiresAt: new Date(), token: 'tok' }
const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test', emailVerified: true, createdAt: new Date(), updatedAt: new Date() }

const ctx = { headers: new Headers() }

const CURRENT_SPEND = { campaignId: CAMPAIGN_ID, date: '2024-04-15' }
const PERIODS = {
  budgetStartDate: '2024-01-01',
  budgetEndDate: '2024-12-31',
  campaignStartDate: '2024-03-01',
  campaignEndDate: '2024-06-30',
}

describe('spend.update', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue({ session: mockSession, user: mockUser } as any)
  })

  it('throws BAD_REQUEST when no fields are provided', async () => {
    const mockDb = createDirectDb([])

    const err = await call(procedure as any, { id: SPEND_ID }, {
      context: { ...ctx, db: mockDb },
    } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('BAD_REQUEST')
    expect((err as ORPCError).message).toBe('No fields to update')
  })

  it('throws NOT_FOUND when spend does not exist (date update path)', async () => {
    const mockDb = createDirectDb([[]])

    const err = await call(procedure as any, { id: SPEND_ID, date: '2024-05-01' }, {
      context: { ...ctx, db: mockDb },
    } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('NOT_FOUND')
  })

  it('throws BAD_REQUEST when effective campaignId does not exist', async () => {
    const mockDb = createDirectDb([
      [CURRENT_SPEND], // fetch current spend
      [], // period lookup returns empty
    ])

    const err = await call(procedure as any, { id: SPEND_ID, date: '2024-05-01' }, {
      context: { ...ctx, db: mockDb },
    } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('BAD_REQUEST')
    expect((err as ORPCError).message).toBe('Invalid campaign ID')
  })

  it('throws BAD_REQUEST when effective date is outside the budget period', async () => {
    const mockDb = createDirectDb([
      [CURRENT_SPEND],
      [PERIODS],
    ])

    const err = await call(procedure as any, {
      id: SPEND_ID,
      date: '2025-01-01',
    }, { context: { ...ctx, db: mockDb } } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('BAD_REQUEST')
  })

  it('throws BAD_REQUEST when effective date is outside the campaign period', async () => {
    const mockDb = createDirectDb([
      [CURRENT_SPEND],
      [PERIODS],
    ])

    const err = await call(procedure as any, {
      id: SPEND_ID,
      date: '2024-08-01',
    }, { context: { ...ctx, db: mockDb } } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('BAD_REQUEST')
  })

  it('skips period checks when only amountCents is updated', async () => {
    // campaignId and date not in input → no current fetch, no period check
    const updatedRow = { id: SPEND_ID, campaignId: CAMPAIGN_ID, amountCents: 9999, date: '2024-04-15' }
    const mockDb = createDirectDb([[updatedRow]])

    const result = await call(procedure as any, {
      id: SPEND_ID,
      amountCents: 9999,
    }, { context: { ...ctx, db: mockDb } } as any)

    expect(result).toEqual({ success: true })
  })

  it('succeeds when effective date is within both periods', async () => {
    const updatedRow = { id: SPEND_ID, campaignId: CAMPAIGN_ID, amountCents: 500, date: '2024-05-01' }
    const mockDb = createDirectDb([
      [CURRENT_SPEND],
      [PERIODS],
      [updatedRow],
    ])

    const result = await call(procedure as any, {
      id: SPEND_ID,
      date: '2024-05-01',
    }, { context: { ...ctx, db: mockDb } } as any)

    expect(result).toEqual({ success: true })
  })
})
