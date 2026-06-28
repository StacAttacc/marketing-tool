<script setup lang="ts">
const { logout } = useAuth()

const signOut = async () => {
  await logout()
}

const route = useRoute()[4:27:34 PM]  WARN  [Vue warn]: Failed to resolve component: VDatePicker
If this is a native custom element, make sure to exclude it from component resolution via compilerOptions.isCustomElement. at <EsDateRangePicker>
at <Dashboard>
at <RouteProvider>
at <RouterView>
at <NuxtPage>
at <Default>
at <AsyncComponentWrapper>
at <LayoutLoader>
at <NuxtLayoutProvider>
at <NuxtLayout>
at <App>
at <NuxtRoot>
[4:27:34 PM]  WARN  [Vue warn]: Component <Anonymous> is missing template or render function. at <Anonymous>
at <EsDateRangePicker>
at <Dashboard>
at <RouteProvider>
at <RouterView>
at <NuxtPage>
at <Default>
at <AsyncComponentWrapper>
at <LayoutLoader>
at <NuxtLayoutProvider>
at <NuxtLayout>
at <App>
at <NuxtRoot>
[4:30:00 PM] ℹ hmr update /tailwind.css?direct, /tailwind.css
[4:30:07 PM] ✔ Vite server hmr 1 files in 0.006ms
[4:30:07 PM]  WARN  [Vue warn]: Failed to resolve component: VDatePicker
If this is a native custom element, make sure to exclude it from component resolution via compilerOptions.isCustomElement. at <EsDateRangePicker>
at <Dashboard>
at <RouteProvider>
at <RouterView>
at <NuxtPage>
at <Default>
at <AsyncComponentWrapper>
at <LayoutLoader>
at <NuxtLayoutProvider>
at <NuxtLayout>
at <App>
at <NuxtRoot>
[4:30:07 PM]  WARN  [Vue warn]: Component <Anonymous> is missing template or render function. at <Anonymous>
at <EsDateRangePicker>
at <Dashboard>
at <RouteProvider>
at <RouterView>
at <NuxtPage>
at <Default>
at <AsyncComponentWrapper>
at <LayoutLoader>
at <NuxtLayoutProvider>
at <NuxtLayout>
at <App>
at <NuxtRoot>

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

    <button
      to="/"
      @click="signOut"
    >
      <Icon name="lucide:log-out" />
      <span class="dock-label">Sign Out</span>
    </button>
  </nav>

  <EsChatModal
    :is-open="isChatOpen"
    @close="isChatOpen = false"
  />
</template>
