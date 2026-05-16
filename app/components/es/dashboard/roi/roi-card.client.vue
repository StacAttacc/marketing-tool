<script setup lang="ts">
import { useFilteredChartSpends } from '~/queries/spend/useFilteredChartSpends'
import { useFilteredChartResults } from '~/queries/result/useFilteredChartResults'

const props = defineProps<{
  range: { start: Date, end: Date }
  selectedChannel: string | null
}>()

const { data: spendData, isLoading: spendLoading } = useFilteredChartSpends(computed(() => props.range))
const { data: resultData, isLoading: resultsLoading } = useFilteredChartResults(computed(() => props.range))

const isLoading = computed(() => spendLoading.value || resultsLoading.value)

const totalSpend = computed(() => {
  if (!spendData.value?.spends) return 0
  return spendData.value.spends
    .filter(s => props.selectedChannel === null || s.channelName === props.selectedChannel)
    .reduce((sum, s) => sum + (s.amountCents ?? 0), 0) / 100
})

const totalRevenue = computed(() => {
  if (!resultData.value?.results) return 0
  return resultData.value.results
    .filter(r => props.selectedChannel === null || r.channelName === props.selectedChannel)
    .reduce((sum, r) => sum + (r.revenueCents ?? 0), 0) / 100
})

const roi = computed(() => {
  if (totalSpend.value === 0) return null
  return (totalRevenue.value - totalSpend.value) / totalSpend.value * 100
})

const formatted = computed(() => {
  if (roi.value === null) return '—'
  return `${roi.value.toFixed(1)}%`
})
</script>

<template>
  <EsDashboardCommonStatCard
    label="ROI"
    :value="formatted"
    :is-loading="isLoading"
  />
</template>
