import { drizzle, type NeonDatabase } from 'drizzle-orm/neon-serverless'
import ws from 'ws'

import { env } from '~~/server/env'

import * as schema from './schemas/index'
import * as secondSchema from './schemas-second/schema'

type NeonDb = ReturnType<typeof drizzle>

export type Database = NeonDatabase<typeof schema>
export type SecondDatabase = NeonDatabase<typeof secondSchema>

export type ReadOnlyDatabase = {
  select: NeonDb['select']
  query: NeonDb['query']
}

declare global {
  var __db__: Database | undefined
  var __secondDb__: SecondDatabase | undefined
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

export const getSecondDb = (): ReadOnlyDatabase => {
  if (globalThis.__secondDb__) {
    return {
      select: globalThis.__secondDb__.select.bind(globalThis.__secondDb__),
      query: globalThis.__secondDb__.query,
    }
  }

  const db = drizzle({
    connection: env.SECOND_DATABASE_URL,
    schema: secondSchema,
    casing: 'snake_case',
    ws,
  })

  globalThis.__secondDb__ = db

  return {
    select: db.select.bind(db),
    query: db.query,
  }
}
