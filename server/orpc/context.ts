import { os } from '@orpc/server'
import { dbProvider } from '~~/server/orpc/middlewares/dbProvider'

export const base = os
  .$context<{ headers: Headers }>()
  .use(dbProvider)
