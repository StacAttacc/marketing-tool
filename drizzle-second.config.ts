import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './server/database/schemas-second',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.SECOND_DATABASE_URL!,
  },
})
