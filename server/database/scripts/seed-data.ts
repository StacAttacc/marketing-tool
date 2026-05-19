import { seed, seedCustomers } from '~~/server/database/seed'

await seed()
await seedCustomers()
