import { describe, it, expect } from 'vitest'
import { tryCatch, tryCatchSync } from '~~/shared/utils/tryCatch'

describe('tryCatch', () => {
  it('returns data and null error on success', async () => {
    const { data, error } = await tryCatch(Promise.resolve(42))
    expect(data).toBe(42)
    expect(error).toBeNull()
  })

  it('returns null data and error on rejection', async () => {
    const { data, error } = await tryCatch(Promise.reject(new Error('boom')))
    expect(data).toBeNull()
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toBe('boom')
  })
})

describe('tryCatchSync', () => {
  it('returns data and null error on success', () => {
    const { data, error } = tryCatchSync(() => 'ok')
    expect(data).toBe('ok')
    expect(error).toBeNull()
  })

  it('returns null data and error on throw', () => {
    const { data, error } = tryCatchSync(() => {
      throw new Error('sync fail')
    })
    expect(data).toBeNull()
    expect((error as Error).message).toBe('sync fail')
  })
})
