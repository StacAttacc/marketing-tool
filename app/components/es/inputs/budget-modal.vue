<script setup lang="ts">
import type { Budget, Channel, ChannelBudget } from '~~/server/database/schemas'

interface ChannelAllocation {
  channelId: string
  channelName: string
  percentage: number
  amountCents: number
}

const props = defineProps<{
  isOpen: boolean
  mode: 'create' | 'view' | 'edit'
  budget?: Budget | null
  channels: Channel[]
  channelBudgets: ChannelBudget[]
}>()

const emit = defineEmits<{
  close: []
  save: [data: {
    budgetPeriod: string
    startDate: string
    endDate: string
    totalBudgetCents: number
    id?: string
    allocations: { channelId: string, allocatedBudgetCents: number }[]
  }]
  delete: [budgetId: string]
}>()

const formData = ref({
  budgetPeriod: '',
  startDate: '',
  endDate: '',
  totalBudgetCents: 0,
})

const channelAllocations = ref<ChannelAllocation[]>([])
const localMode = ref<'create' | 'view' | 'edit'>('create')
const isEditable = computed(() => localMode.value !== 'view')

const totalAllocatedPercentage = computed(() =>
  channelAllocations.value.reduce((sum, ch) => sum + ch.percentage, 0),
)

const remainingPercentage = computed(() =>
  Math.round((100 - totalAllocatedPercentage.value) * 100) / 100,
)

const isFormValid = computed(() => {
  return formData.value.budgetPeriod.trim() !== ''
    && formData.value.startDate !== ''
    && formData.value.endDate !== ''
    && formData.value.totalBudgetCents > 0
    && Math.abs(totalAllocatedPercentage.value - 100) < 0.01
})

const title = computed(() => localMode.value === 'create' ? 'Create Budget Period' : 'Budget Period Details')

function initializeForm() {
  localMode.value = props.mode

  if (props.budget && props.mode !== 'create') {
    formData.value = {
      budgetPeriod: props.budget.budgetPeriod,
      startDate: props.budget.startDate,
      endDate: props.budget.endDate,
      totalBudgetCents: props.budget.totalBudgetCents,
    }
    initializeAllocationsFromBudget()
  }
  else {
    formData.value = { budgetPeriod: '', startDate: '', endDate: '', totalBudgetCents: 0 }
    initializeEmptyAllocations()
  }
}

function initializeEmptyAllocations() {
  channelAllocations.value = props.channels.map(channel => ({
    channelId: channel.id,
    channelName: channel.name,
    percentage: 0,
    amountCents: 0,
  }))
}

function initializeAllocationsFromBudget() {
  const budgetAllocations = props.channelBudgets.filter(cb => cb.budgetId === props.budget?.id)
  const totalCents = props.budget?.totalBudgetCents || 0

  channelAllocations.value = props.channels.map((channel) => {
    const existing = budgetAllocations.find(ba => ba.channelId === channel.id)
    const amountCents = existing?.allocatedBudgetCents || 0
    const percentage = totalCents > 0 ? (amountCents / totalCents) * 100 : 0
    return {
      channelId: channel.id,
      channelName: channel.name,
      percentage: Math.round(percentage * 100) / 100,
      amountCents,
    }
  })
}

function getSliderBackground(index: number): string {
  const percentage = channelAllocations.value[index]!.percentage
  return `linear-gradient(to right, oklch(var(--p)) ${percentage}%, oklch(var(--b3)) ${percentage}%)`
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

const startDateObj = computed({
  get: () => formData.value.startDate ? new Date(formData.value.startDate) : null,
  set: (val: Date | null) => {
    formData.value.startDate = val ? val.toISOString().split('T')[0]! : ''
  },
})

const endDateObj = computed({
  get: () => formData.value.endDate ? new Date(formData.value.endDate) : null,
  set: (val: Date | null) => {
    formData.value.endDate = val ? val.toISOString().split('T')[0]! : ''
  },
})

watch(() => formData.value.totalBudgetCents, () => {
  channelAllocations.value.forEach((allocation) => {
    allocation.amountCents = Math.round((allocation.percentage / 100) * formData.value.totalBudgetCents)
  })
})

watch(
  () => channelAllocations.value.map(a => a.percentage),
  () => {
    let total = 0
    for (const allocation of channelAllocations.value) {
      const maxAllowed = 100 - total
      if (allocation.percentage > maxAllowed) {
        allocation.percentage = maxAllowed
      }
      total += allocation.percentage
    }

    for (const allocation of channelAllocations.value) {
      allocation.amountCents = Math.round((allocation.percentage / 100) * formData.value.totalBudgetCents)
    }
  },
)

watch(() => props.channels, (newChannels) => {
  if (props.isOpen && newChannels.length > 0 && channelAllocations.value.length === 0) {
    if (props.mode === 'create') {
      initializeEmptyAllocations()
    }
    else {
      initializeAllocationsFromBudget()
    }
  }
})

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) initializeForm()
})

watch(() => props.mode, () => {
  if (props.isOpen) initializeForm()
})

const startDateRef = ref<HTMLDetailsElement | null>(null)
const endDateRef = ref<HTMLDetailsElement | null>(null)
const startCalendarRef = ref<HTMLDivElement | null>(null)
const endCalendarRef = ref<HTMLDivElement | null>(null)
const startPickerOpen = ref(false)
const endPickerOpen = ref(false)
const startPickerPos = ref({ top: 0, left: 0 })
const endPickerPos = ref({ top: 0, left: 0 })

const startPickerStyle = computed(() => ({ top: `${startPickerPos.value.top}px`, left: `${startPickerPos.value.left}px` }))
const endPickerStyle = computed(() => ({ top: `${endPickerPos.value.top}px`, left: `${endPickerPos.value.left}px` }))

function onStartToggle(e: Event) {
  startPickerOpen.value = (e.target as HTMLDetailsElement).open
  if (startPickerOpen.value && startDateRef.value) {
    const rect = startDateRef.value.getBoundingClientRect()
    startPickerPos.value = { top: rect.bottom + 4, left: Math.min(rect.left, window.innerWidth - 310) }
  }
}

function onEndToggle(e: Event) {
  endPickerOpen.value = (e.target as HTMLDetailsElement).open
  if (endPickerOpen.value && endDateRef.value) {
    const rect = endDateRef.value.getBoundingClientRect()
    endPickerPos.value = { top: rect.bottom + 4, left: Math.min(rect.left, window.innerWidth - 310) }
  }
}

watch(startDateObj, (val) => {
  if (val && startDateRef.value?.open) {
    startDateRef.value.open = false
    startPickerOpen.value = false
  }
})

watch(endDateObj, (val) => {
  if (val && endDateRef.value?.open) {
    endDateRef.value.open = false
    endPickerOpen.value = false
  }
})

const handleDateClickOutside = (e: MouseEvent) => {
  if (startPickerOpen.value && !startDateRef.value?.contains(e.target as Node) && !startCalendarRef.value?.contains(e.target as Node)) {
    startDateRef.value!.open = false
    startPickerOpen.value = false
  }
  if (endPickerOpen.value && !endDateRef.value?.contains(e.target as Node) && !endCalendarRef.value?.contains(e.target as Node)) {
    endDateRef.value!.open = false
    endPickerOpen.value = false
  }
}

function closeAllDatePickers() {
  if (startDateRef.value?.open) {
    startDateRef.value!.open = false
    startPickerOpen.value = false
  }
  if (endDateRef.value?.open) {
    endDateRef.value.open = false
    endPickerOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleDateClickOutside)
  window.addEventListener('resize', closeAllDatePickers)
})
onUnmounted(() => {
  document.removeEventListener('click', handleDateClickOutside)
  window.removeEventListener('resize', closeAllDatePickers)
})
</script>

<template>
  <EsInputsCommonModalWrapper
    :is-open="isOpen"
    :title="title"
    :mode="localMode"
    :is-form-valid="isFormValid"
    @close="emit('close')"
    @save="emit('save', {
      ...formData,
      id: budget?.id,
      allocations: channelAllocations.map(a => ({
        channelId: a.channelId,
        allocatedBudgetCents: Math.round((a.percentage / 100) * formData.totalBudgetCents),
      })),
    })"
    @delete="budget && emit('delete', budget.id)"
    @edit="localMode = 'edit'"
  >
    <div class="grid grid-cols-3 gap-4">
      <EsInputsCommonFormField label="Budget Period Name">
        <input
          v-model="formData.budgetPeriod"
          type="text"
          placeholder="e.g., week 1"
          class="input input-bordered rounded-lg border border-base-200 disabled:bg-base-100 disabled:text-base-content disabled:border-base-200 disabled:opacity-100"
          :disabled="!isEditable"
        >
      </EsInputsCommonFormField>

      <EsInputsCommonFormField label="Start Date">
        <details
          ref="startDateRef"
          class="w-full"
          :class="{ 'pointer-events-none opacity-50': !isEditable }"
          @toggle="onStartToggle"
        >
          <summary class="input input-bordered rounded-lg border border-base-200 flex items-center cursor-pointer">
            <span :class="{ 'opacity-40': !startDateObj }">
              {{ startDateObj ? startDateObj.toLocaleDateString() : 'Pick a date...' }}
            </span>
          </summary>
        </details>
        <Teleport to="body">
          <div
            v-if="startPickerOpen"
            ref="startCalendarRef"
            class="fixed z-[9999] rounded-box bg-base-100 shadow shadow-prometheus-orange/50"
            :style="startPickerStyle"
          >
            <VDatePicker
              v-model="startDateObj"
              mode="date"
              color="orange"
              :columns="1"
              transparent
              borderless
            />
          </div>
        </Teleport>
      </EsInputsCommonFormField>

      <EsInputsCommonFormField label="End Date">
        <details
          ref="endDateRef"
          class="w-full"
          :class="{ 'pointer-events-none opacity-50': !isEditable }"
          @toggle="onEndToggle"
        >
          <summary class="input input-bordered rounded-lg border border-base-200 flex items-center cursor-pointer">
            <span :class="{ 'opacity-40': !endDateObj }">
              {{ endDateObj ? endDateObj.toLocaleDateString() : 'Pick a date...' }}
            </span>
          </summary>
        </details>
        <Teleport to="body">
          <div
            v-if="endPickerOpen"
            ref="endCalendarRef"
            class="fixed z-[9999] rounded-box bg-base-100 shadow-md"
            :style="endPickerStyle"
          >
            <VDatePicker
              v-model="endDateObj"
              mode="date"
              color="orange"
              :columns="1"
              transparent
              borderless
            />
          </div>
        </Teleport>
      </EsInputsCommonFormField>
    </div>

    <EsInputsCommonFormField label="Total Budget (cents)">
      <div class="flex items-center gap-4">
        <input
          v-model.number="formData.totalBudgetCents"
          type="number"
          min="0"
          step="1"
          placeholder="0"
          class="input input-bordered rounded-lg border border-base-200 flex-1 disabled:bg-base-100 disabled:text-base-content disabled:border-base-200 disabled:opacity-100"
          :disabled="!isEditable"
        >
        <span class="text-sm opacity-70">{{ formatCents(formData.totalBudgetCents) }}</span>
      </div>
    </EsInputsCommonFormField>

    <EsInputsCommonFormField label="Channel Allocations">
      <span
        class="label-text-alt"
        :class="{ 'text-error': remainingPercentage !== 0 }"
      >
        {{ remainingPercentage.toFixed(1) }}% remaining
      </span>
      <div class="space-y-3">
        <div
          v-for="(allocation, index) in channelAllocations"
          :key="allocation.channelId"
          class="flex items-center gap-4 p-2 border border-base-200 rounded-lg"
        >
          <span class="w-32 truncate">{{ allocation.channelName }}</span>
          <input
            v-model.number="allocation.percentage"
            type="range"
            min="0"
            :max="100"
            step="5"
            class="range range-xs flex-1 disabled:bg-base-100 disabled:text-base-content disabled:border-base-200 disabled:opacity-100"
            :style="{ background: getSliderBackground(index) }"
            :disabled="!isEditable"
          >
          <span class="w-16 text-right">{{ allocation.percentage }}%</span>
          <span class="w-24 text-right text-sm opacity-70">{{ formatCents(allocation.amountCents) }}</span>
        </div>
        <div
          v-if="channelAllocations.length === 0"
          class="text-center opacity-50 py-4"
        >
          No channels available
        </div>
      </div>
    </EsInputsCommonFormField>
  </EsInputsCommonModalWrapper>
</template>

<style scoped>
summary {
  list-style: none;
}

summary::-webkit-details-marker {
  display: none;
}

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
  height: 1;
  border-radius: 0;
  background: oklch(var(--p));
  cursor: pointer;
}
</style>
