<script setup lang="ts">
import { useTotalUsersAllTime } from '~/queries/result/useTotalUsersAllTime'

const { data, isLoading } = useTotalUsersAllTime()

const formatted = computed(() =>
  data.value?.totalUsers.toLocaleString('en-US') ?? '—',
)
</script>

<template>
  <EsDashboardCommonStatCard
    label="Total Users (All Time)"
    :value="formatted"
    :is-loading="isLoading"
  />
</template>
