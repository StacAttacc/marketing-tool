<script setup lang="ts">
import { useFilteredChartResults } from '~/queries/result/useFilteredChartResults'

const props = defineProps<{
  range: { start: Date, end: Date }
  selectedChannel: string | null
}>()

const { data, isLoading } = useFilteredChartResults(computed(() => props.range))

const filtered = computed(() => {
  if (!data.value?.results) return []
  return data.value.results.filter(r => props.selectedChannel === null || r.channelName === props.selectedChannel)
})

const value = computed(() => {
  const users = filtered.value.reduce((sum, r) => sum + (r.usersAcquired ?? 0), 0)
  const revenue = filtered.value.reduce((sum, r) => sum + (r.revenueCents ?? 0), 0) / 100
  return users > 0 ? revenue / users : null
})

const formatted = computed(() => {
  if (value.value === null) return '—'
  return value.value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
})
</script>

<template>
  <EsDashboardCommonStatCard
    label="Revenue / User"
    :value="formatted"
    :is-loading="isLoading"
  />
</template>
