<script setup lang="ts">
import type { Budget } from '~~/server/database/schemas'

const props = defineProps<{
  budgets: Budget[]
  disabled?: boolean
}>()

const modelValue = defineModel<string>({ required: true })

const sortedBudgets = computed(() => {
  return [...props.budgets].sort((a, b) =>
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  )
})

function formatBudgetOption(budget: Budget): string {
  return `${budget.budgetPeriod} (${budget.startDate} - ${budget.endDate})`
}

const selectedLabel = computed(() => {
  const b = sortedBudgets.value.find(b => b.id === modelValue.value)
  return b ? formatBudgetOption(b) : ''
})

const detailsRef = ref<HTMLDetailsElement>()

function pick(val: string) {
  modelValue.value = val
  if (detailsRef.value) detailsRef.value.open = false
}

function closeIfOutside(e: FocusEvent) {
  if (!detailsRef.value?.contains(e.relatedTarget as Node))
    detailsRef.value!.open = false
}
</script>

<template>
  <EsInputsCommonFormField label="Budget Period">
    <details
      ref="detailsRef"
      class="dropdown dropdown-bottom w-full rounded-lg border border-base-200 bg-base-100 flex items-center px-3 h-12 text-sm cursor-pointer"
      :class="{ 'opacity-50 pointer-events-none': disabled }"
      @focusout="closeIfOutside"
    >
      <summary
        class="flex-1 truncate"
        :class="{ 'text-base-content/40': !selectedLabel }"
      >
        {{ selectedLabel || 'Select a budget period' }}
      </summary>
      <ul class="menu dropdown-content left-0 mt-1 bg-base-100 rounded-box shadow-md z-100 w-full p-1">
        <li
          v-for="b in sortedBudgets"
          :key="b.id"
        >
          <a
            :class="{ active: b.id === modelValue }"
            @click="pick(b.id)"
          >{{ formatBudgetOption(b) }}</a>
        </li>
      </ul>
    </details>
  </EsInputsCommonFormField>
</template>

<style scoped>
details {
  position: relative;
  overflow: visible;
}
</style>
