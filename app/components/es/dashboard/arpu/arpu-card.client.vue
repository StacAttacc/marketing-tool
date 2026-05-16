<script setup lang="ts">
import { useFilteredChartResults } from '~/queries/result/useFilteredChartResults'

const props = defineProps<{
  range: { start: Date, end: Date }
  selectedChannel: string | null
}>()

const { data: resultData, isLoading } = useFilteredChartResults(computed(() => props.range))

const filtered = computed(() => {
  if (!resultData.value?.results) return []
  return resultData.value.results.filter((r) => {
    const d = new Date(r.date)
    const inRange = d >= props.range.start && d <= props.range.end
    const inChannel = props.selectedChannel === null || r.channelName === props.selectedChannel
    return inRange && inChannel
  })
})

const totalRevenue = computed(() =>
  filtered.value.reduce((sum, r) => sum + (r.revenueCents ?? 0), 0) / 100,
)

const totalUsers = computed(() =>
  filtered.value.reduce((sum, r) => sum + (r.usersAcquired ?? 0), 0),
)

const arpu = computed(() => {
  if (totalUsers.value === 0) return null
  return totalRevenue.value / totalUsers.value
})

const formatted = computed(() => {
  if (arpu.value === null) return '—'
  return arpu.value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
})
</script>

<template>
  <EsDashboardCommonStatCard
    label="ARPU"
    :value="formatted"
    :is-loading="isLoading"
  />
</template>
