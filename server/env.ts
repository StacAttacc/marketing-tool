import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    NODE_ENV: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().min(1),
    DATABASE_URL: z.string().min(1),
    SECOND_DATABASE_URL: z.string().min(1),
    ANTHROPIC_API_KEY: z.string().min(1),
  },
  runtimeEnv: process.env,
})
