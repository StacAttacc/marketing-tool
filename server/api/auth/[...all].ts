import { auth } from '~~/server/utils/auth'
import { env } from '~~/server/env'
import { webRequestFromEvent } from '~~/server/utils/webRequestFromEvent'

export default defineEventHandler(async (event) => {
  const request = await webRequestFromEvent(event, env.BETTER_AUTH_URL)
  return auth.handler(request)
})
