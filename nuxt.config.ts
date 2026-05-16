import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/icon', '@nuxtjs/color-mode'],
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  app: {
    head: {
      htmlAttrs: {
        'data-theme': 'caramellatte',
      },
    },
  },
  css: ['./app/tailwind.css'],
  runtimeConfig: {
    betterAuthSecret: process.env.BETTER_AUTH_SECRET,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    public: {
      betterAuthUrl: process.env.BETTER_AUTH_URL,
    },
    databaseUrl: process.env.DATABASE_URL,
  },
  routeRules: {
    '/**': {
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': 'default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:; font-src \'self\' data:; connect-src \'self\'',
      },
    },
  },
  compatibilityDate: '2025-07-15',
  vite: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plugins: [tailwindcss() as any],
  },
  eslint: {
    config: {
      stylistic: true,
      typescript: true,
    },
  },
})
