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

const totalUsers = computed(() => {
  if (!resultData.value?.results) return 0
  return resultData.value.results
    .filter(r => props.selectedChannel === null || r.channelName === props.selectedChannel)
    .reduce((sum, r) => sum + (r.usersAcquired ?? 0), 0)
})

const cpa = computed(() => {
  if (totalUsers.value === 0) return null
  return totalSpend.value / totalUsers.value
})

const formatted = computed(() => {
  if (cpa.value === null) return '—'
  return cpa.value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
})
</script>

<template>
  <EsDashboardCommonStatCard
    label="CPA"
    :value="formatted"
    :is-loading="isLoading"
  />
</template>
