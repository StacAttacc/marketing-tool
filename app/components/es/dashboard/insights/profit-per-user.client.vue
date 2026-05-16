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

const value = computed(() => {
  const spend = (spendData.value?.spends ?? [])
    .filter(s => props.selectedChannel === null || s.channelName === props.selectedChannel)
    .reduce((sum, s) => sum + (s.amountCents ?? 0), 0) / 100
  const revenue = (resultData.value?.results ?? [])
    .filter(r => props.selectedChannel === null || r.channelName === props.selectedChannel)
    .reduce((sum, r) => sum + (r.revenueCents ?? 0), 0) / 100
  const users = (resultData.value?.results ?? [])
    .filter(r => props.selectedChannel === null || r.channelName === props.selectedChannel)
    .reduce((sum, r) => sum + (r.usersAcquired ?? 0), 0)
  return users > 0 ? (revenue - spend) / users : null
})

const formatted = computed(() => {
  if (value.value === null) return '—'
  return value.value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
})
</script>

<template>
  <EsDashboardCommonStatCard
    label="Profit / User"
    :value="formatted"
    :is-loading="isLoading"
  />
</template>
