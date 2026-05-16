import { onError } from '@orpc/server'
import { RPCHandler } from '@orpc/server/fetch'
import { getDb } from '~~/server/database/db'

import { router } from '~~/server/orpc/router'

const handler = new RPCHandler(router, {
  interceptors: [
    onError((error) => {
      console.error('[rpc error]', error.code, error.message)
    }),
  ],
})

export default defineEventHandler(async (event) => {
  const request = toWebRequest(event)

  const { response } = await handler.handle(request, {
    prefix: '/api/rpc',
    context: { headers: event.headers, db: getDb() },
  })

  if (response) {
    return response
  }

  setResponseStatus(event, 404, 'Not Found')
  return 'Not found'
})
