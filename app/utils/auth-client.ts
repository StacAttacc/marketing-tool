import { sentinelClient } from '@better-auth/infra/client'
import { createAuthClient } from 'better-auth/vue'

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL,
  plugins: [
    sentinelClient(),
  ],
})

export const useAuth = () => {
  const session = authClient.useSession()

  const login = async (email: string, password: string) => {
    const result = await authClient.signIn.email({ email, password })
    await session.value?.refetch()
    return result
  }

  const logout = async () => {
    await authClient.signOut()
    await session.value?.refetch()
    navigateTo('/')
  }

  return { session, login, logout }
}
