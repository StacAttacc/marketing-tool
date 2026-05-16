<script lang="ts" setup>
const route = useRoute()
const { activeTabLabel } = useActiveTab()

const routeNameMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/budget-input': 'Budget Inputs',
  '/demo': 'Demo',
}

const breadcrumbs = computed(() => {
  const pathSegments = route.path.split('/').filter(Boolean)

  const crumbs = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/')
    return {
      label: routeNameMap[path] || segment,
      path,
      isLast: false,
    }
  })

  if (crumbs.length > 0) {
    if (activeTabLabel.value) {
      crumbs[crumbs.length - 1]!.isLast = false
      crumbs.push({
        label: activeTabLabel.value,
        path: '',
        isLast: true,
      })
    }
    else {
      crumbs[crumbs.length - 1]!.isLast = true
    }
  }

  return crumbs
})
</script>

<template>
  <div class="navbar bg-base-300 text-prometheus-orange">
    <div class="flex items-center">
      <label
        for="main-drawer"
        aria-label="open sidebar"
        class="text-prometheus-orange cursor-auto hover:cursor-pointer ml-6 pt-2"
      >
        <Icon name="lucide:panel-right" />
      </label>
      <div class="breadcrumbs text-sm mx-4 mt-1">
        <ul>
          <li>
            <NuxtLink to="/dashboard">
              Home
            </NuxtLink>
          </li>
          <li
            v-for="crumb in breadcrumbs"
            :key="crumb.path"
          >
            <NuxtLink
              v-if="crumb.path !== route.path"
              :to="crumb.path"
            >
              {{ crumb.label }}
            </NuxtLink>
            <span v-else>{{ crumb.label }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
