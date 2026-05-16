<script setup lang="ts">
const { logout } = useAuth()

const signOut = async () => {
  await logout()
}

const isChatOpen = ref(false)
</script>

<template>
  <div class="pt-22 flex min-h-full flex-col items-start bg-base-200 text-prometheus-orange is-drawer-close:w-14 is-drawer-open:w-64">
    <ul class="menu w-full grow">
      <li>
        <NuxtLink
          to="/dashboard"
          class="is-drawer-close:tooltip is-drawer-close:tooltip-right"
        >
          <Icon name="lucide:layout-dashboard" />
          <span class="is-drawer-close:hidden">Dashboard</span>
        </NuxtLink>
      </li>
      <li>
        <NuxtLink
          to="/budget-input"
          class="is-drawer-close:tooltip is-drawer-close:tooltip-right"
        >
          <Icon name="lucide:text-cursor-input" />
          <span class="is-drawer-close:hidden">Budget Input</span>
        </NuxtLink>
      </li>
      <li>
        <NuxtLink
          to="/demo"
          class="is-drawer-close:tooltip is-drawer-close:tooltip-right"
        >
          <Icon name="lucide:play" />
          <span class="is-drawer-close:hidden">Demo</span>
        </NuxtLink>
      </li>
    </ul>
    <ul class="menu w-full">
      <li>
        <a
          class="is-drawer-close:tooltip is-drawer-close:tooltip-right cursor-pointer"
          @click="isChatOpen = true"
        >
          <Icon
            name="lucide:bot"
            size="12"
          />
          <span class="is-drawer-close:hidden">Chatbot</span>
        </a>
      </li>
      <li>
        <NuxtLink
          to="/"
          class="is-drawer-close:tooltip is-drawer-close:tooltip-right cursor-auto hover:cursor-pointer"
          @click="signOut"
        >
          <Icon name="lucide:log-out" />
          <span class="is-drawer-close:hidden">Sign Out</span>
        </NuxtLink>
      </li>
    </ul>
  </div>

  <EsChatModal
    :is-open="isChatOpen"
    @close="isChatOpen = false"
  />
</template>
