<script setup lang="ts">
import { useListBudgets } from '~/queries/budget/useListBudgets'

definePageMeta({
  layout: 'default',
})

const { data: budgetsData } = useListBudgets()

const selectedBudgetId = ref<string | null>(null)
const totalBudgetCents = ref(0)

const selectedBudget = computed(() =>
  budgetsData.value?.budgets.find(b => b.id === selectedBudgetId.value),
)

const totalBudgetFormatted = computed(() =>
  (totalBudgetCents.value / 100).toLocaleString('en-US', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }),
)

watch(budgetsData, (data) => {
  if (selectedBudgetId.value || !data?.budgets) return
  const today = new Date().toISOString().slice(0, 10)
  const selected = data.budgets.find(b => b.endDate < today)
    ?? data.budgets.find(b => b.startDate <= today && b.endDate >= today)
  if (selected) {
    selectedBudgetId.value = selected.id
    totalBudgetCents.value = selected.totalBudgetCents
  }
}, { immediate: true })

watch(selectedBudget, (budget) => {
  if (budget) totalBudgetCents.value = budget.totalBudgetCents
})

const dropdownRef = ref<HTMLDetailsElement | null>(null)
const isOpen = ref(false)

const onToggle = (e: Event) => {
  isOpen.value = (e.target as HTMLDetailsElement).open
}

const handleClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value?.open && !dropdownRef.value.contains(e.target as Node)) {
    dropdownRef.value.open = false
    isOpen.value = false
  }
}

const selectBudget = (id: string) => {
  selectedBudgetId.value = id
  if (dropdownRef.value) {
    dropdownRef.value.open = false
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<template>
  <div class="p-4">
    <div class="flex items-center gap-2 pb-3 mb-4 border-b border-base-300">
      <h3 class="shrink-0">
        Budget Prediction
      </h3>
      <div class="w-px h-5 bg-base-300 shrink-0 mx-1" />

      <details
        ref="dropdownRef"
        class="dropdown"
        @toggle="onToggle"
      >
        <summary
          class="btn btn-sm border border-transparent rounded-lg"
          :class="isOpen ? 'bg-base-300' : 'bg-base-100 border-base-300 hover:bg-base-200'"
        >
          <Icon name="lucide:calendar" />
          {{ selectedBudget?.budgetPeriod ?? 'Select period' }}
          <Icon :name="isOpen ? 'lucide:chevron-up' : 'lucide:chevron-down'" />
        </summary>
        <div class="dropdown-content z-50 mt-2 rounded-xl bg-base-100 shadow shadow-prometheus-orange/50 p-1">
          <ul class="menu w-full">
            <li
              v-for="b in budgetsData?.budgets"
              :key="b.id"
            >
              <button
                class="hover:bg-base-200 w-full text-left rounded-xl text-sm whitespace-nowrap"
                :class="{ 'bg-base-200': b.id === selectedBudgetId }"
                @click="selectBudget(b.id)"
              >
                {{ b.budgetPeriod }}
              </button>
            </li>
          </ul>
        </div>
      </details>

      <div class="w-px h-5 bg-base-300 shrink-0 mx-1" />

      <label class="input input-sm flex bg-base-100/50 items-center gap-1">
        <span class="text-base-content/50 shrink-0">Planned budget</span>
        <input
          v-model.number="totalBudgetCents"
          type="number"
          min="0"
          step="100"
          class="w-24 text-right tabular-nums"
          placeholder="0"
        >
        <span class="text-base-content/50 shrink-0 text-xs">{{ totalBudgetFormatted }}</span>
      </label>
    </div>

    <EsDemoOverview
      :budget-id="selectedBudgetId"
      :total-budget-cents="totalBudgetCents"
    />
  </div>
</template>

<style scoped>
summary {
  list-style: none;
}

summary::-webkit-details-marker {
  display: none;
}
</style>
