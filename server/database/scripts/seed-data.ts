import { getDb } from '~~/server/database/db'
import { channel } from '~~/server/database/schemas'
import { seed, seedCustomers } from '~~/server/database/seed'

const db = getDb()

console.log('🔍 Checking DB connection...')
await db.select().from(channel).limit(1).catch((e) => {
  throw new Error(`DB connection failed: ${e.message}`)
})
console.log('✅ DB connected, channel table accessible')

await seed()
await seedCustomers()
