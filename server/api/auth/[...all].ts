import { auth } from '~~/server/utils/auth'

export default defineEventHandler((event) => {
  return auth.handler(new Request(getRequestURL(event), event.req))
})
