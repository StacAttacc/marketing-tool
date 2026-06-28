import { env } from '~~/server/env'
import { auth } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const url = new URL(event.path, env.BETTER_AUTH_URL)

  const headers = new Headers()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawHeaders = (event.node?.req?.headers ?? (event.req as any)?.headers ?? {}) as Record<string, string | string[] | undefined>
  if (typeof (rawHeaders as { entries?: () => Iterable<[string, string]> }).entries === 'function') {
    for (const [k, v] of (rawHeaders as unknown as Headers).entries()) headers.set(k, v)
  }
  else {
    for (const [k, v] of Object.entries(rawHeaders)) {
      if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(', ') : String(v))
    }
  }

  const init: RequestInit = { method, headers }
  if (method !== 'GET' && method !== 'HEAD') {
    const body = await readRawBody(event, false)
    if (body) init.body = body
  }

  return auth.handler(new Request(url, init))
})
