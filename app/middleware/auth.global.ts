import { useAuth } from '../utils/auth-client'

const publicRoutes = new Set(['/'])

export default defineNuxtRouteMiddleware((to) => {
  const { session } = useAuth()

  if (session.value?.isPending) return

  const isAuthenticated = !!session.value?.data
  const isPublicRoute = publicRoutes.has(to.path)

  if (isAuthenticated && isPublicRoute) {
    return navigateTo('/dashboard')
  }

  if (!isAuthenticated && !isPublicRoute) {
    return navigateTo('/')
  }
})
