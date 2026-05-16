import { drizzle, type NeonDatabase } from 'drizzle-orm/neon-serverless'
import ws from 'ws'

import { env } from '~~/server/env'

import * as schema from './schemas/index'

export type Database = NeonDatabase<typeof schema>

declare global {
  var __db__: Database | undefined
}

export const getDb = () => {
  if (globalThis.__db__) {
    return globalThis.__db__
  }

  const db = drizzle({
    connection: env.DATABASE_URL,
    schema,
    casing: 'snake_case',
    ws,
  })

  globalThis.__db__ = db

  return db
}
