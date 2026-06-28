import { env } from '~~/server/env'
import { auth } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const inbound = getRequestURL(event)
  const url = new URL(inbound.pathname + inbound.search, env.BETTER_AUTH_URL)

  const init: RequestInit = {
    method,
    headers: getRequestHeaders(event) as HeadersInit,
  }
  if (method !== 'GET' && method !== 'HEAD') {
    const body = await readRawBody(event, false)
    if (body) init.body = body
  }

  return auth.handler(new Request(url, init))
})
