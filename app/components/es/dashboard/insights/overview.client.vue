<script setup lang="ts">
import { useChannelColors } from '~/composables/useChannelColors'
import { useListBudgets } from '~/queries/budget/useListBudgets'

const props = defineProps<{
  syncChannel?: string | null
}>()

const { channelColors } = useChannelColors()

const selectedChannel = ref<string | null>(null)

watch(() => props.syncChannel, (v) => {
  if (v !== undefined) selectedChannel.value = v
})

const { data: budgetData } = useListBudgets()

const quarters = computed(() =>
  (budgetData.value?.budgets ?? []).map(b => ({
    key: b.id,
    label: b.budgetPeriod,
    start: new Date(b.startDate),
    end: new Date(b.endDate ?? b.startDate),
  })),
)

const selectedQuarterKey = ref<string | null>(null)

watch(quarters, (qs) => {
  if (qs.length && !selectedQuarterKey.value) {
    selectedQuarterKey.value = qs[0]!.key
  }
}, { immediate: true })

const range = computed(() => {
  const q = quarters.value.find(q => q.key === selectedQuarterKey.value) ?? quarters.value[0]
  if (!q) return { start: new Date(), end: new Date() }
  return { start: q.start, end: q.end }
})

const selectedQuarter = computed(() => quarters.value.find(q => q.key === selectedQuarterKey.value))

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

const selectQuarter = (key: string) => {
  selectedQuarterKey.value = key
  if (dropdownRef.value) {
    dropdownRef.value.open = false
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<template>
  <div class="rounded-xl bg-base-200/50 p-4 shadow shadow-prometheus-orange/50">
    <div class="flex flex-col gap-2 pb-3 mb-4 border-b border-base-300 sm:flex-row sm:items-center">
      <div class="flex items-center gap-2 sm:flex-1 min-w-0">
        <h3 class="shrink-0">
          Insights
        </h3>
        <details
          ref="dropdownRef"
          class="dropdown"
          @toggle="onToggle"
        >
          <summary
            class="btn btn-sm border border-transparent rounded-lg"
            :class="isOpen ? 'bg-base-300' : 'bg-base-100 border-base-300 hover:bg-base-200'"
            :aria-disabled="!quarters.length"
          >
            <Icon name="lucide:calendar" />
            {{ selectedQuarter?.label ?? 'Select period' }}
            <Icon :name="isOpen ? 'lucide:chevron-up' : 'lucide:chevron-down'" />
          </summary>
          <div class="dropdown-content z-50 mt-2 rounded-xl bg-base-100 shadow shadow-prometheus-orange/50 p-1">
            <ul class="menu w-full">
              <li
                v-for="q in quarters"
                :key="q.key"
              >
                <button
                  class="hover:bg-base-200 w-full text-left rounded-xl text-sm whitespace-nowrap"
                  :class="{ 'bg-base-200': q.key === selectedQuarterKey }"
                  @click="selectQuarter(q.key)"
                >
                  {{ q.label }}
                </button>
              </li>
            </ul>
          </div>
        </details>
      </div>
      <EsDashboardCommonChannelSelector
        v-model:selected="selectedChannel"
        :channels="channelColors"
      />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div class="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
        <EsDashboardInsightsBudgetTotal :range="range" />
        <EsDashboardInsightsRevenueTotal
          :range="range"
          :selected-channel="selectedChannel"
        />
        <EsDashboardInsightsSpendTotal
          :range="range"
          :selected-channel="selectedChannel"
        />
      </div>
      <div class="lg:col-span-4 space-y-4">
        <EsDashboardInsightsChart
          :range="range"
          :selected-channel="selectedChannel"
        />
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <EsDashboardInsightsUsersAllTime />
          <EsDashboardInsightsRevenuePerUser
            :range="range"
            :selected-channel="selectedChannel"
          />
          <EsDashboardInsightsSpendPerUser
            :range="range"
            :selected-channel="selectedChannel"
          />
          <EsDashboardInsightsProfitPerUser
            :range="range"
            :selected-channel="selectedChannel"
          />
        </div>
      </div>
    </div>
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
