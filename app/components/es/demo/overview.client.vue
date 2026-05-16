<script setup lang="ts">
defineProps<{
  budgetId: string | null
  totalBudgetCents: number
}>()
</script>

<template>
  <div class="flex flex-col gap-4">
    <EsDemoPredictionAllocation
      :budget-id="budgetId"
      :total-budget-cents="totalBudgetCents"
    />
    <EsDemoPastPredictions :budget-id="budgetId" />
  </div>
</template>
