<script setup lang="ts">
const props = defineProps<{
  syncRange?: { start: Date, end: Date }
  syncChannel?: string | null
}>()

const { range, selectedChannel, channelColors } = useOverviewSection(props)
</script>

<template>
  <div class="rounded-xl bg-base-200/50 p-4 shadow shadow-prometheus-orange/50">
    <div class="flex flex-col gap-2 pb-3 mb-4 border-b border-base-300 sm:flex-row sm:items-center">
      <h3 class="shrink-0">
        ARPU
      </h3>
      <div class="flex items-center gap-2 sm:flex-1 min-w-0">
        <EsDateRangePicker
          v-model="range"
          class="shrink-0"
        />
        <EsDashboardCommonChannelSelector
          v-model:selected="selectedChannel"
          :channels="channelColors"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div class="lg:col-span-4">
        <EsDashboardArpuChart
          :range="range"
          :selected-channel="selectedChannel"
        />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
        <EsDashboardArpuRevenueTotal
          :range="range"
          :selected-channel="selectedChannel"
        />
        <EsDashboardArpuUsersTotal
          :range="range"
          :selected-channel="selectedChannel"
        />
        <EsDashboardArpuCard
          :range="range"
          :selected-channel="selectedChannel"
        />
      </div>
    </div>
  </div>
</template>
