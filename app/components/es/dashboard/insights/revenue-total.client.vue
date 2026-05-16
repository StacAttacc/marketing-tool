<script setup lang="ts">
import { useFilteredChartResults } from '~/queries/result/useFilteredChartResults'

const props = defineProps<{
  range: { start: Date, end: Date }
  selectedChannel: string | null
}>()

const { data, isLoading } = useFilteredChartResults(computed(() => props.range))

const total = computed(() => {
  if (!data.value?.results) return 0
  return data.value.results
    .filter(r => props.selectedChannel === null || r.channelName === props.selectedChannel)
    .reduce((sum, r) => sum + (r.revenueCents ?? 0), 0) / 100
})

const formatted = computed(() =>
  total.value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
)
</script>

<template>
  <EsDashboardCommonStatCard
    label="Total Revenue"
    :value="formatted"
    :is-loading="isLoading"
  />
</template>
