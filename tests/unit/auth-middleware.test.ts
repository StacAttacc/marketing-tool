/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { os, ORPCError, call } from '@orpc/server'

import { auth } from '~~/server/utils/auth'
import { authMiddleware } from '~~/server/orpc/middlewares/auth'

vi.mock('~~/server/utils/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}))
vi.mock('~~/server/database/db', () => ({
  getDb: vi.fn(() => ({})),
  getSecondDb: vi.fn(() => ({})),
}))

const mockSession = { id: 'session-1', userId: 'user-1', expiresAt: new Date(), token: 'tok' }
const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test', emailVerified: true, createdAt: new Date(), updatedAt: new Date() }

const testProcedure = os
  .$context<{ headers: Headers }>()
  .use(authMiddleware as any)
  .handler(async ({ context }) => ({ userId: (context as any).user.id }))

describe('authMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws UNAUTHORIZED when no session exists', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null)

    const err = await call(testProcedure as any, undefined, {
      context: { headers: new Headers() },
    } as any).catch(e => e)

    expect(err).toBeInstanceOf(ORPCError)
    expect((err as ORPCError).code).toBe('UNAUTHORIZED')
  })

  it('passes through with valid session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({ session: mockSession, user: mockUser } as any)

    const result = await call(testProcedure as any, undefined, {
      context: { headers: new Headers() },
    } as any)

    expect(result).toEqual({ userId: 'user-1' })
  })
})
