/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { call } from '@orpc/server'
import { createDirectDb } from '../helpers/db'

import { auth } from '~~/server/utils/auth'
import procedure from '~~/server/orpc/router/result/filteredList'

vi.mock('~~/server/utils/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}))
vi.mock('~~/server/database/db', () => ({
  getDb: vi.fn(() => ({})),
  getSecondDb: vi.fn(() => ({})),
}))

const mockSession = { id: 'session-1', userId: 'user-1', expiresAt: new Date(), token: 'tok' }
const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test', emailVerified: true, createdAt: new Date(), updatedAt: new Date() }

const ctx = { headers: new Headers() }

const row1 = { id: 'r-1', revenueCents: 1000, usersAcquired: 10, date: '2024-01-15', campaignId: 'camp-1', channelId: 'ch-1', channelName: 'Google', budgetId: 'b-1', budgetPeriod: 'Q1 2024' }
const row2 = { id: 'r-2', revenueCents: 2000, usersAcquired: 20, date: '2024-01-16', campaignId: 'camp-1', channelId: 'ch-1', channelName: 'Google', budgetId: 'b-1', budgetPeriod: 'Q1 2024' }

describe('result.filteredList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue({ session: mockSession, user: mockUser } as any)
  })

  it('returns results and pagination without search', async () => {
    const mockDb = createDirectDb([
      [row1, row2], // results query
      [{ value: 2 }], // count query
    ])

    const result = await call(procedure as any, { limit: 10, offset: 0 }, {
      context: { ...ctx, db: mockDb },
    } as any)

    expect(result).toEqual({
      results: [row1, row2],
      pagination: { total: 2, limit: 10, offset: 0, hasMore: false },
      sort: { sortBy: 'date', sortDirection: 'desc' },
    })
  })

  it('returns filtered results when searching by channel name', async () => {
    const mockDb = createDirectDb([
      [row1], // results query (filtered)
      [{ value: 1 }], // count query
    ])

    const result = await call(procedure as any, {
      limit: 10,
      offset: 0,
      search: 'Google',
      searchField: 'channel',
    }, { context: { ...ctx, db: mockDb } } as any)

    expect(result).toEqual({
      results: [row1],
      pagination: { total: 1, limit: 10, offset: 0, hasMore: false },
      sort: { sortBy: 'date', sortDirection: 'desc' },
    })
  })

  it('sets hasMore: true when more results exist beyond the current page', async () => {
    const mockDb = createDirectDb([
      [row1, row2], // results query (page of 2)
      [{ value: 5 }], // count query (5 total)
    ])

    // offset(0) + results.length(2) < total(5) → hasMore: true
    const result = await call(procedure as any, { limit: 2, offset: 0 }, {
      context: { ...ctx, db: mockDb },
    } as any)

    expect((result as any).pagination.hasMore).toBe(true)
    expect((result as any).pagination.total).toBe(5)
  })
})
