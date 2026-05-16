import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'

import type { Router } from '~~/server/orpc/router'

export default defineNuxtPlugin({
  name: 'orpc-client',
  setup: () => {
    const link = new RPCLink({
      url: `${globalThis.location.origin}/api/rpc`,
      headers: () => ({}),
      fetch: (input, init) => fetch(input, { ...init, credentials: 'include' }),
    })

    const client: RouterClient<Router> = createORPCClient(link)
    const orpc = createTanstackQueryUtils(client)

    return {
      provide: {
        orpc,
      },
    }
  },
})
