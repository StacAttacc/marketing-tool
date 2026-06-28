import { env } from '~~/server/env'
import { auth } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const url = new URL(event.req.url, env.BETTER_AUTH_URL)

  const init: RequestInit = {
    method: event.req.method,
    headers: event.req.headers,
  }
  if (event.req.method !== 'GET' && event.req.method !== 'HEAD') {
    init.body = await event.req.arrayBuffer()
  }

  return auth.handler(new Request(url, init))
})
