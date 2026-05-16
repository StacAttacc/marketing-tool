import { auth } from '~~/server/utils/auth'
import { os, ORPCError } from '@orpc/server'

export const authMiddleware = os
  .$context<{ headers: Headers }>()
  .middleware(async ({ context, next }) => {
    const sessionData = await auth.api.getSession({
      headers: context.headers,
    })

    if (!sessionData?.session || !sessionData?.user) {
      throw new ORPCError('UNAUTHORIZED')
    }

    return next({
      context: {
        ...context,
        session: sessionData.session,
        user: sessionData.user,
      },
    })
  })
