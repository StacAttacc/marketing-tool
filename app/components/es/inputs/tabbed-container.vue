<script setup lang="ts">
interface Tab {
  label: string
  component: Component
}

const props = defineProps<{
  tabs: Tab[]
}>()

const { setActiveTab } = useActiveTab()

const activeTab = ref(0)

onMounted(() => {
  setActiveTab(props.tabs[0]!.label || null)
})

watch(activeTab, (index) => {
  setActiveTab(props.tabs[index]!.label || null)
})

onUnmounted(() => {
  setActiveTab(null)
})
</script>

<template>
  <div class="my-2 mx-1">
    <div
      role="tablist"
      class="tabs tabs-border rounded-xl"
    >
      <button
        v-for="(tab, index) in props.tabs"
        :key="index"
        class="rounded-xl"
        :class="['tab', { 'tab-active': activeTab === index }]"
        role="tab"
        :aria-selected="activeTab === index"
        @click="activeTab = index"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="mt-4">
      <component :is="props.tabs[activeTab]!.component" />
    </div>
  </div>
</template>
