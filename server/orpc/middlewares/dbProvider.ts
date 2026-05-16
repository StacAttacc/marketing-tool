import { os } from '@orpc/server'

import type { Database } from '~~/server/database/db'
import { getDb } from '~~/server/database/db'

export const dbProvider = os
  .$context<{ db?: Database }>()
  .middleware(async ({ context, next }) => {
    const db = context.db ?? getDb()
    return next({ context: { db } })
  })
