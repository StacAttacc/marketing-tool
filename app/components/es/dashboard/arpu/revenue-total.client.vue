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
    .filter(result => props.selectedChannel === null || result.channelName === props.selectedChannel)
    .reduce((sum, result) => sum + (result.revenueCents ?? 0), 0) / 100
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
