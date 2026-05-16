import { os } from '@orpc/server'

import type { Database, ReadOnlyDatabase } from '~~/server/database/db'
import { getDb, getSecondDb } from '~~/server/database/db'

export const dbProvider = os
  .$context<{ db?: Database, secondDb?: ReadOnlyDatabase }>()
  .middleware(async ({ context, next }) => {
    const db = context.db ?? getDb()
    const secondDb = context.secondDb ?? getSecondDb()
    return next({ context: { db, secondDb } })
  })
