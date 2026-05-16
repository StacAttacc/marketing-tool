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
    .filter(result => props.selectedChannel === null || result.channelName === props.selectedChannel)
    .reduce((sum, result) => sum + (result.usersAcquired ?? 0), 0)
})

const formatted = computed(() =>
  totalUsers.value.toLocaleString('en-US'),
)
</script>

<template>
  <EsDashboardCommonStatCard
    label="Total Users Acquired"
    :value="formatted"
    :is-loading="isLoading"
  />
</template>
