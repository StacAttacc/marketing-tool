import { ORPCError, onError } from '@orpc/server'
import { RPCHandler } from '@orpc/server/fetch'
import { getDb } from '~~/server/database/db'
import { env } from '~~/server/env'
import { webRequestFromEvent } from '~~/server/utils/webRequestFromEvent'

import { router } from '~~/server/orpc/router'

const handler = new RPCHandler(router, {
  interceptors: [
    onError((error) => {
      if (error instanceof ORPCError) {
        console.error('[rpc error]', error.code, error.message)
      }
      else {
        console.error('[rpc error]', error)
      }
    }),
  ],
})

export default defineEventHandler(async (event) => {
  const request = await webRequestFromEvent(event, env.BETTER_AUTH_URL)

  const { response } = await handler.handle(request, {
    prefix: '/api/rpc',
    context: { headers: request.headers, db: getDb() },
  })

  if (response) {
    return response
  }

  setResponseStatus(event, 404, 'Not Found')
  return 'Not found'
})
