import { env } from '~~/server/env'
import { auth } from '~~/server/utils/auth'

export default defineEventHandler((event) => {
  const url = new URL(event.req.url, env.BETTER_AUTH_URL)
  return auth.handler(new Request(url, event.req))
})
