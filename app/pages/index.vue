<script setup lang="ts">
import { useAuth } from '../utils/auth-client'

definePageMeta({
  layout: 'login-layout',
})

const { login } = useAuth()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  try {
    const result = await login(email.value, password.value)
    if (result.error) {
      error.value = result.error.message || 'Login failed. Please try again.'
      loading.value = false
      return
    }
    navigateTo('/dashboard')
  }
  catch (e) {
    error.value = (e as Error).message || 'An unexpected error occurred.'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="hero bg-base-300 text-prometheus-orange h-full w-full">
    <div class="hero-content flex-col">
      <div class="card rounded-xl bg-base-200 w-full max-w-sm shrink-0 shadow-2xl">
        <div class="card-body">
          <fieldset
            class="fieldset"
            @keyup.enter="handleLogin"
          >
            <label
              class="label"
              for="email"
            >
              Email
            </label>
            <input
              v-model="email"
              type="email"
              class="input rounded-xl bg-base-100 border-prometheus-orange"
              placeholder="Email"
            >
            <label
              class="label"
              for="password"
            >
              Password
            </label>
            <input
              v-model="password"
              type="password"
              class="input rounded-xl bg-base-100 border-prometheus-orange"
              placeholder="Password"
            >
            <div
              v-if="error"
              class="text-error mt-2"
            >
              {{ error }}
            </div>
            <button
              type="submit"
              class="btn rounded-xl bg-prometheus-orange text-base-100 mt-4"
              :disabled="loading"
              @click="handleLogin"
            >
              Login
            </button>
          </fieldset>
        </div>
      </div>
    </div>
  </div>
</template>
