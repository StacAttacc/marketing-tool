<script setup lang="ts">
import { useFilteredChartResults } from '~/queries/result/useFilteredChartResults'

const props = defineProps<{
  range: { start: Date, end: Date }
  selectedChannel: string | null
}>()

const { data: resultData, isLoading } = useFilteredChartResults(computed(() => props.range))

const totalUsers = computed(() => {
  if (!resultData.value?.results) return 0

  return resultData.value.results
    .filter((r) => {
      const d = new Date(r.date)
      const inRange = d >= props.range.start && d <= props.range.end
      const inChannel = props.selectedChannel === null || r.channelName === props.selectedChannel
      return inRange && inChannel
    })
    .reduce((sum, r) => sum + (r.usersAcquired ?? 0), 0)
})

const formatted = computed(() => totalUsers.value.toLocaleString('en-US'))
</script>

<template>
  <EsDashboardCommonStatCard
    label="Users Acquired"
    :value="formatted"
    :is-loading="isLoading"
  />
</template>
