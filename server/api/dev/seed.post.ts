import { seed, seedCustomers } from '~~/server/database/seed'

export default defineEventHandler(async () => {
  if (process.env.NODE_ENV === 'production') {
    throw createError({ statusCode: 403 })
  }

  await seed()
  await seedCustomers()

  return { ok: true }
})
