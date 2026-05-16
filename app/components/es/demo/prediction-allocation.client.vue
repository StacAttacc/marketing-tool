<script setup lang="ts">
import { useChannelEfficiency } from '~/queries/demo/useChannelEfficiency'
import { useChannelEfficiencyAllTime } from '~/queries/demo/useChannelEfficiencyAllTime'
import { useChannelColors } from '~/composables/useChannelColors'
import { useCreateBudgetPrediction } from '~/queries/budgetPrediction/useCreateBudgetPrediction'

const props = defineProps<{
  budgetId: string | null
  totalBudgetCents: number
}>()

const budgetIdRef = computed(() => props.budgetId)

const { data, isLoading } = useChannelEfficiency(budgetIdRef)
const { data: allTimeData } = useChannelEfficiencyAllTime()
const { getColor } = useChannelColors()

const allTimeMap = computed(() =>
  new Map(allTimeData.value?.channels.map(c => [c.channelId, c.revenuePerUser]) ?? []),
)

const channels = computed(() => data.value?.channels ?? [])
interface ChannelAllocation {
  channelId: string
  channelName: string
  percentage: number
  amountCents: number
}

const allocations = ref<ChannelAllocation[]>([])

watch(channels, (chs) => {
  const existing = new Map(allocations.value.map(a => [a.channelId, a.percentage]))
  allocations.value = chs.map((ch) => {
    const percentage = existing.get(ch.channelId) ?? 0
    const amountCents = Math.round((percentage / 100) * props.totalBudgetCents)
    return {
      channelId: ch.channelId,
      channelName: ch.channelName,
      percentage,
      amountCents,
    }
  })
}, { immediate: true })

watch(() => props.totalBudgetCents, (total) => {
  allocations.value.forEach((a) => {
    a.amountCents = Math.round((a.percentage / 100) * total)
  })
})

watch(
  () => allocations.value.map(a => a.percentage),
  () => {
    let total = 0
    for (const a of allocations.value) {
      const maxAllowed = 100 - total
      if (a.percentage > maxAllowed) a.percentage = maxAllowed
      total += a.percentage
    }
    allocations.value.forEach((a) => {
      a.amountCents = Math.round((a.percentage / 100) * props.totalBudgetCents)
    })
  },
)

const totalAllocatedPercentage = computed(() =>
  allocations.value.reduce((s, a) => s + a.percentage, 0),
)

const remainingPercentage = computed(() =>
  Math.round((100 - totalAllocatedPercentage.value) * 100) / 100,
)

function getSliderBackground(index: number): string {
  const pct = allocations.value[index]!.percentage
  return `linear-gradient(to right, oklch(var(--p)) ${pct}%, oklch(var(--b3)) ${pct}%)`
}

const channelMap = computed(() =>
  new Map(channels.value.map(ch => [ch.channelId, ch])),
)

const predictions = computed(() =>
  allocations.value.map((a) => {
    const ch = channelMap.value.get(a.channelId)
    if (!ch) return { channelId: a.channelId, channelName: a.channelName, predictedUsers: 0, allTimePredictedRevenueCents: 0 }

    const usersPerCent = ch.totalSpendCents > 0 ? ch.usersAcquired / ch.totalSpendCents : 0

    const predictedUsers = Math.round(a.amountCents * usersPerCent)
    const allTimePredictedRevenueCents = Math.round((allTimeMap.value.get(a.channelId) ?? 0) * predictedUsers)

    return { channelId: a.channelId, channelName: a.channelName, predictedUsers, allTimePredictedRevenueCents }
  }),
)

const totals = computed(() => ({
  amountCents: allocations.value.reduce((s, a) => s + a.amountCents, 0),
  predictedUsers: predictions.value.reduce((s, p) => s + p.predictedUsers, 0),
  allTimePredictedRevenueCents: predictions.value.reduce((s, p) => s + p.allTimePredictedRevenueCents, 0),
}))

const fmtCents = (cents: number) =>
  (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })

const predictionPeriod = ref('')
const createError = ref<string | null>(null)
const { mutate: createPrediction, isPending: isCreating } = useCreateBudgetPrediction()

const canSave = computed(() =>
  !!props.budgetId && !!predictionPeriod.value && allocations.value.length > 0,
)

function savePrediction() {
  if (!props.budgetId || !predictionPeriod.value) return
  createError.value = null
  createPrediction(
    {
      budgetId: props.budgetId,
      predictionPeriod: predictionPeriod.value,
      totalBudgetCents: props.totalBudgetCents,
      channels: allocations.value.map((a, i) => ({
        channelId: a.channelId,
        allocatedBudgetCents: a.amountCents,
        predictedRevenueCents: predictions.value[i]?.allTimePredictedRevenueCents,
        predictedUsersAcquired: predictions.value[i]?.predictedUsers,
      })),
    },
    {
      onSuccess: () => { predictionPeriod.value = '' },
      onError: (err: Error) => { createError.value = err.message },
    },
  )
}
</script>

<template>
  <div class="rounded-xl bg-base-200/50 p-4 shadow shadow-prometheus-orange/50">
    <div class="flex items-center gap-2 pb-3 mb-4 border-b border-base-300">
      <h3 class="shrink-0">
        Spend Prediction
      </h3>
      <span
        v-if="allocations.length"
        class="text-sm"
        :class="remainingPercentage !== 0 ? 'text-error' : 'text-base-content/50'"
      >
        {{ remainingPercentage.toFixed(1) }}% remaining
      </span>
      <div class="flex items-center gap-2 ml-auto">
        <input
          v-model="predictionPeriod"
          type="text"
          placeholder="Label (e.g. Q2 2026)"
          class="input input-sm input-bordered w-44"
          :disabled="!budgetId"
        >
        <button
          class="btn btn-sm border rounded-lg bg-transparent border-base-300 hover:bg-base-200"
          :disabled="!canSave || isCreating"
          @click="savePrediction"
        >
          <span
            v-if="isCreating"
            class="loading loading-spinner loading-xs"
          />
          Save Prediction
        </button>
      </div>
    </div>

    <div
      v-if="createError"
      class="alert alert-error mb-4"
    >
      <span>{{ createError }}</span>
    </div>

    <div
      v-if="isLoading"
      class="flex justify-center items-center py-12"
    >
      <span class="loading loading-spinner loading-lg text-prometheus-orange" />
    </div>

    <div
      v-else-if="allocations.length"
      class="overflow-x-auto rounded-xl bg-base-100 shadow shadow-base-300 p-4"
    >
      <table class="table table-sm w-full">
        <thead>
          <tr class="border-b border-base-300 text-base-content/60 text-xs uppercase tracking-wide">
            <th class="bg-transparent">
              <div class="flex items-center gap-1">
                <Icon name="lucide:megaphone" />
                Channel
              </div>
            </th>
            <th class="bg-transparent">
              <div class="flex items-center gap-1">
                <Icon name="lucide:dollar-sign" />
                Allocation
              </div>
            </th>
            <th class="bg-transparent text-right">
              <div class="flex items-center justify-end gap-1">
                <Icon name="lucide:users" />
                Predicted New Users
              </div>
            </th>
            <th class="bg-transparent text-right">
              <div class="flex items-center justify-end gap-1">
                <Icon name="lucide:banknote" />
                Predicted Revenue
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(a, index) in allocations"
            :key="a.channelId"
            class="border-b border-base-300/50 hover:bg-base-300/30 transition-colors"
          >
            <td class="font-medium w-40">
              <div class="flex items-center gap-2">
                <span
                  class="w-2.5 h-2.5 rounded-sm shrink-0"
                  :style="{ backgroundColor: getColor(a.channelName) }"
                />
                {{ a.channelName }}
              </div>
            </td>
            <td>
              <div class="flex items-center gap-3">
                <input
                  v-model.number="a.percentage"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  class="range range-xs flex-1"
                  :style="{ background: getSliderBackground(index) }"
                >
                <span class="text-sm w-10 text-right tabular-nums">{{ a.percentage }}%</span>
                <span class="text-sm opacity-70 w-20 text-right tabular-nums">{{ fmtCents(a.amountCents) }}</span>
              </div>
            </td>
            <td class="text-right tabular-nums">
              {{ predictions[index]!.predictedUsers.toLocaleString('en-US') }}
            </td>
            <td class="text-right tabular-nums">
              {{ fmtCents(predictions[index]!.allTimePredictedRevenueCents) }}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="border-t-2 border-base-300 font-semibold">
            <td>Total</td>
            <td class="tabular-nums text-sm">
              {{ fmtCents(totals.amountCents) }}
            </td>
            <td class="text-right tabular-nums">
              {{ totals.predictedUsers.toLocaleString('en-US') }}
            </td>
            <td class="text-right tabular-nums">
              {{ fmtCents(totals.allTimePredictedRevenueCents) }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div
      v-else
      class="flex justify-center items-center py-12 text-gray-500 text-sm rounded-xl bg-base-100 shadow shadow-base-300 px-4"
    >
      No data available for the selected budget period
    </div>
  </div>
</template>

<style scoped>
input[type="range"].range {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
}

input[type="range"].range::-webkit-slider-runnable-track {
  height: 0.5rem;
  border-radius: 0.25rem;
}

input[type="range"].range::-moz-range-track {
  height: 0.5rem;
  border-radius: 0.25rem;
}

input[type="range"].range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 0.75cap;
  height: 1rem;
  border-radius: 0;
  background: oklch(var(--p));
  cursor: pointer;
}
</style>
