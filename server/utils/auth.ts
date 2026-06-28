import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { getDb } from '~~/server/database/db'
import * as schema from '~~/server/database/schemas/index'
import { env } from '~~/server/env'

export const auth = betterAuth({
  secret: env.BETTER_AUTH_API_KEY,
  database: drizzleAdapter(getDb(), {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24,
    updateAge: 60 * 15,
  },
})
