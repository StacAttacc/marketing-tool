import { sentinelClient } from '@better-auth/infra/client'
import { createAuthClient } from 'better-auth/vue'

let _authClient: ReturnType<typeof createAuthClient> | null = null

function getAuthClient() {
  if (!_authClient) {
    _authClient = createAuthClient({
      baseURL: import.meta.client ? window.location.origin : useRuntimeConfig().public.betterAuthUrl,
      plugins: [sentinelClient()],
    })
  }
  return _authClient
}

export const useAuth = () => {
  const authClient = getAuthClient()
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
