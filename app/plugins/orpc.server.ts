import { createRouterClient } from '@orpc/server'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'

import { router } from '~~/server/orpc/router'

export default defineNuxtPlugin({
  name: 'orpc-server',
  setup: () => {
    const event = useRequestEvent()

    const client = createRouterClient(router, {
      context: {
        headers: event?.headers ?? new Headers(),
      },
    })
    const orpc = createTanstackQueryUtils(client)

    return {
      provide: {
        orpc,
      },
    }
  },
})
