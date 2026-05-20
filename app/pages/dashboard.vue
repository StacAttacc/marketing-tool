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

const selectChannel = (channelName: string | null) => {
  selectedChannel.value = selectedChannel.value === channelName ? null : channelName
}
</script>

<template>
  <div class="p-4">
    <!-- Global filter toolbar -->
    <div class="flex flex-col gap-2 pb-3 mb-4 border-b border-base-300 sm:flex-row sm:items-center">
      <EsDateRangePicker
        v-model="range"
        class="shrink-0"
      />
      <div class="overflow-x-auto scrollbar-thin sm:flex-1">
        <div class="flex gap-1.5 min-w-max">
          <button
            class="btn btn-sm border border-transparent rounded-lg"
            :class="selectedChannel === null ? 'bg-base-300' : 'bg-transparent border-base-300 hover:bg-base-200'"
            @click="selectChannel(null)"
          >
            All
          </button>
          <button
            v-for="ch in channelColors"
            :key="ch.name"
            class="btn btn-sm border border-transparent rounded-lg"
            :class="selectedChannel === ch.name ? 'bg-base-300' : 'bg-transparent border-base-300 hover:bg-base-200'"
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
