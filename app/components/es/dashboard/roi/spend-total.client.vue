<script setup lang="ts">
import { useFilteredChartSpends } from '~/queries/spend/useFilteredChartSpends'

const props = defineProps<{
  range: { start: Date, end: Date }
  selectedChannel: string | null
}>()

const { data: spendData, isLoading } = useFilteredChartSpends(computed(() => props.range))

const totalSpend = computed(() => {
  if (!spendData.value?.spends) return 0
  return spendData.value.spends
    .filter(s => props.selectedChannel === null || s.channelName === props.selectedChannel)
    .reduce((sum, s) => sum + (s.amountCents ?? 0), 0) / 100
})

const formatted = computed(() =>
  totalSpend.value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
)
</script>

<template>
  <EsDashboardCommonStatCard
    label="Total Spend"
    :value="formatted"
    :is-loading="isLoading"
  />
</template>
