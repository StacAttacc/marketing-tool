<script setup lang="ts">
const route = useRoute()
const isDesktop = ref(true)

let mql: MediaQueryList | null = null
const onMqlChange = (e: MediaQueryListEvent) => {
  isDesktop.value = e.matches
}

onMounted(() => {
  mql = window.matchMedia('(min-width: 1024px)')
  isDesktop.value = mql.matches
  mql.addEventListener('change', onMqlChange)
})

onUnmounted(() => {
  mql?.removeEventListener('change', onMqlChange)
})

const layoutName = computed(() => {
  if (route.path === '/') return 'login-layout'
  return isDesktop.value ? 'default' : 'mobile'
})
</script>

<template>
  <NuxtLayout :name="layoutName">
    <NuxtPage />
  </NuxtLayout>
</template>
