import type { RouterClient } from '@orpc/server'
import type { Router } from '~~/server/orpc/router'
import type { createTanstackQueryUtils } from '@orpc/tanstack-query'

type OrpcUtils = ReturnType<typeof createTanstackQueryUtils<RouterClient<Router>>>

export function useOrpc() {
  const { $orpc } = useNuxtApp()
  return $orpc as OrpcUtils
}
