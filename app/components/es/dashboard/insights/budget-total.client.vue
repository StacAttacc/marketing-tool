<script setup lang="ts">
import { useListBudgets } from '~/queries/budget/useListBudgets'

const props = defineProps<{
  range: { start: Date, end: Date }
}>()

const { data, isLoading } = useListBudgets()

const total = computed(() => {
  if (!data.value?.budgets) return 0
  const qStart = props.range.start.toISOString().slice(0, 10)
  const qEnd = props.range.end.toISOString().slice(0, 10)
  return data.value.budgets
    .filter(b => b.startDate <= qEnd && (b.endDate === null || b.endDate >= qStart))
    .reduce((sum, b) => sum + (b.totalBudgetCents ?? 0), 0) / 100
})

const formatted = computed(() =>
  total.value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
)
</script>

<template>
  <EsDashboardCommonStatCard
    label="Total Budget"
    :value="formatted"
    :is-loading="isLoading"
  />
</template>
