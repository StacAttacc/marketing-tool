import { base } from './context'
import { authMiddleware } from '~~/server/orpc/middlewares/auth'

export const authorized = base.use(authMiddleware)
