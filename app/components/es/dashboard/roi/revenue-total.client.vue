<script setup lang="ts">
import { useFilteredChartResults } from '~/queries/result/useFilteredChartResults'

const props = defineProps<{
  range: { start: Date, end: Date }
  selectedChannel: string | null
}>()

const { data: resultData, isLoading } = useFilteredChartResults(computed(() => props.range))

const totalRevenue = computed(() => {
  if (!resultData.value?.results) return 0
  return resultData.value.results
    .filter((r) => {
      const d = new Date(r.date)
      const inRange = d >= props.range.start && d <= props.range.end
      const inChannel = props.selectedChannel === null || r.channelName === props.selectedChannel
      return inRange && inChannel
    })
    .reduce((sum, r) => sum + (r.revenueCents ?? 0), 0) / 100
})

const formatted = computed(() =>
  totalRevenue.value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
)
</script>

<template>
  <EsDashboardCommonStatCard
    label="Total Revenue"
    :value="formatted"
    :is-loading="isLoading"
  />
</template>
