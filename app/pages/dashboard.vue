<script setup lang="ts">
import { useChannelColors } from '~/composables/useChannelColors'

definePageMeta({
  layout: 'default',
})

const range = ref({
  start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
  end: new Date(),
})

const selectedChannel = ref<string | null>(null)

const { channelColors } = useChannelColors()
</script>

<template>
  <div class="p-4">
    <!-- Global filter toolbar -->
    <div class="flex flex-col gap-2 pb-3 mb-4 border-b border-base-300 sm:flex-row sm:items-center">
      <EsDateRangePicker
        v-model="range"
        class="shrink-0"
      />
      <EsDashboardCommonChannelSelector
        v-model:selected="selectedChannel"
        :channels="channelColors"
      />
    </div>

    <EsDashboardTableOverview
      class="mt-8"
      :sync-range="range"
    />
    <EsDashboardInsightsOverview
      class="mt-8"
      :sync-channel="selectedChannel"
    />
    <EsDashboardArpuOverview
      class="mt-8"
      :sync-range="range"
      :sync-channel="selectedChannel"
    />
    <EsDashboardCpaOverview
      class="mt-8"
      :sync-range="range"
      :sync-channel="selectedChannel"
    />
    <EsDashboardRoiOverview
      class="mt-8"
      :sync-range="range"
      :sync-channel="selectedChannel"
    />
  </div>
</template>
