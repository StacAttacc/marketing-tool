<script setup lang="ts">
const { logout } = useAuth()

const signOut = async () => {
  await logout()
}

const route = useRoute()

const isChatOpen = ref(false)

const pages = [
  { label: 'Dashboard', icon: 'lucide:layout-dashboard', to: '/dashboard' },
  { label: 'Budget Input', icon: 'lucide:text-cursor-input', to: '/budget-input' },
  { label: 'Demo', icon: 'lucide:play', to: '/demo' },
]
</script>

<template>
  <nav class="dock dock-sm lg:hidden bg-base-200 text-prometheus-orange">
    <NuxtLink
      v-for="item in pages"
      :key="item.to"
      :to="item.to"
      :class="{ 'dock-active': route.path === item.to }"
    >
      <Icon :name="item.icon" />
      <span class="dock-label">{{ item.label }}</span>
    </NuxtLink>

    <button
      :class="{ 'dock-active': isChatOpen }"
      @click="isChatOpen = true"
    >
      <Icon name="lucide:bot" />
      <span class="dock-label">Chat</span>
    </button>

    <NuxtLink
      to="/"
      @click="signOut"
    >
      <Icon name="lucide:log-out" />
      <span class="dock-label">Sign Out</span>
    </NuxtLink>
  </nav>

  <EsChatModal
    :is-open="isChatOpen"
    @close="isChatOpen = false"
  />
</template>
