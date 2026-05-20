<script setup lang="ts">
const props = defineProps<{
  syncRange?: { start: Date, end: Date }
  syncChannel?: string | null
}>()

const { range, selectedChannel, channelColors, selectChannel } = useOverviewSection(props)
</script>

<template>
  <div class="rounded-xl bg-base-200/50 p-4 shadow shadow-prometheus-orange/50">
    <div class="flex flex-col gap-2 pb-3 mb-4 border-b border-base-300 sm:flex-row sm:items-center">
      <h3 class="shrink-0">
        Average Revenue Per User
      </h3>
      <div class="flex items-center gap-2 sm:flex-1 min-w-0">
        <EsDateRangePicker
          v-model="range"
          class="shrink-0"
        />
        <div class="overflow-x-auto scrollbar-thin flex-1 min-w-0">
          <div class="flex gap-1.5 min-w-max">
            <button
              class="btn btn-sm border border-transparent rounded-lg"
              :class="selectedChannel === null ? 'bg-base-300' : 'bg-base-100 border-base-300 hover:bg-base-200'"
              @click="selectChannel(null)"
            >
              All
            </button>
            <button
              v-for="ch in channelColors"
              :key="ch.name"
              class="btn btn-sm border border-transparent rounded-lg"
              :class="selectedChannel === ch.name ? 'bg-base-300' : 'bg-base-100 border-base-300 hover:bg-base-200'"
              @click="selectChannel(ch.name)"
            >
              <span
                class="w-2.5 h-2.5 rounded-sm inline-block shrink-0"
                :style="{ backgroundColor: ch.color }"
              />
              {{ ch.name }}
            </button>
          </div>
        </div>
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
