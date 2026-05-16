<script setup lang="ts">
import type { Budget, Channel, ChannelBudget } from '~~/server/database/schemas'

const props = defineProps<{
  isOpen: boolean
  mode: 'create' | 'view' | 'edit'
  error?: string | null
  campaign?: {
    id: string
    channelBudgetId: string
    channelId: string
    budgetId: string
    amountCents: number
    startDate: string
    endDate: string | null
  } | null
  budgets: Budget[]
  channels: Channel[]
  channelBudgets: ChannelBudget[]
}>()

const emit = defineEmits<{
  close: []
  save: [data: {
    channelBudgetId: string
    amountCents: number
    startDate: string
    endDate: string
    id?: string
  }]
  delete: [campaignId: string]
}>()

const formData = ref({
  budgetId: '',
  channelId: '',
  channelBudgetId: '',
  startDate: '',
  endDate: '',
  amountCents: 0,
})

const localMode = ref<'create' | 'view' | 'edit'>('create')
const isEditable = computed(() => localMode.value !== 'view')

const selectedBudget = computed(() =>
  props.budgets.find(b => b.id === formData.value.budgetId) ?? null,
)

const minDate = computed(() =>
  selectedBudget.value ? new Date(selectedBudget.value.startDate) : undefined,
)

const maxDate = computed(() =>
  selectedBudget.value ? new Date(selectedBudget.value.endDate) : undefined,
)

const availableChannels = computed(() => {
  if (!formData.value.budgetId) return []
  const budgetChannelIds = new Set(
    props.channelBudgets
      .filter(cb => cb.budgetId === formData.value.budgetId)
      .map(cb => cb.channelId),
  )
  return props.channels.filter(c => budgetChannelIds.has(c.id))
})

const selectedChannelBudget = computed(() => {
  if (!formData.value.budgetId || !formData.value.channelId) return null
  return props.channelBudgets.find(
    cb => cb.budgetId === formData.value.budgetId && cb.channelId === formData.value.channelId,
  )
})

watch([() => formData.value.budgetId, () => formData.value.channelId], () => {
  formData.value.channelBudgetId = selectedChannelBudget.value?.id ?? ''
})

watch(() => formData.value.budgetId, () => {
  if (!availableChannels.value.some(c => c.id === formData.value.channelId)) {
    formData.value.channelId = ''
  }
  // Reset dates when budget changes since min/max change
  formData.value.startDate = ''
  formData.value.endDate = ''
})

const dateRange = computed({
  get: () => ({
    start: formData.value.startDate ? new Date(formData.value.startDate) : null,
    end: formData.value.endDate ? new Date(formData.value.endDate) : null,
  }),
  set: (val: { start: Date | null, end: Date | null }) => {
    formData.value.startDate = val?.start ? val.start.toISOString().split('T')[0]! : ''
    formData.value.endDate = val?.end ? val.end.toISOString().split('T')[0]! : ''
  },
})

const isFormValid = computed(() =>
  formData.value.budgetId !== ''
  && formData.value.channelId !== ''
  && formData.value.channelBudgetId !== ''
  && formData.value.startDate !== ''
  && formData.value.endDate !== ''
  && formData.value.amountCents > 0,
)

const title = computed(() => localMode.value === 'create' ? 'New Campaign' : 'Campaign Details')

function initializeForm() {
  localMode.value = props.mode

  if (props.campaign && props.mode !== 'create') {
    formData.value = {
      budgetId: props.campaign.budgetId,
      channelId: props.campaign.channelId,
      channelBudgetId: props.campaign.channelBudgetId,
      startDate: props.campaign.startDate,
      endDate: props.campaign.endDate ?? '',
      amountCents: props.campaign.amountCents,
    }
  }
  else {
    const latestBudget = [...props.budgets].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    )[0]
    formData.value = {
      budgetId: latestBudget?.id ?? '',
      channelId: '',
      channelBudgetId: '',
      startDate: '',
      endDate: '',
      amountCents: 0,
    }
  }
}

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) initializeForm()
})

watch(() => props.mode, () => {
  if (props.isOpen) initializeForm()
})

const dateRangeRef = ref<HTMLDetailsElement | null>(null)
const rangeCalendarRef = ref<HTMLDivElement | null>(null)
const rangePickerOpen = ref(false)
const rangePickerPos = ref({ top: 0, left: 0 })

const rangePickerStyle = computed(() => ({ top: `${rangePickerPos.value.top}px`, left: `${rangePickerPos.value.left}px` }))

function onRangeToggle(e: Event) {
  rangePickerOpen.value = (e.target as HTMLDetailsElement).open
  if (rangePickerOpen.value && dateRangeRef.value) {
    const rect = dateRangeRef.value.getBoundingClientRect()
    rangePickerPos.value = { top: rect.bottom + 4, left: Math.min(rect.left, window.innerWidth - 310) }
  }
}

const handleDateClickOutside = (e: MouseEvent) => {
  if (rangePickerOpen.value && !dateRangeRef.value?.contains(e.target as Node) && !rangeCalendarRef.value?.contains(e.target as Node)) {
    dateRangeRef.value!.open = false
    rangePickerOpen.value = false
  }
}

function closeAllDatePickers() {
  if (dateRangeRef.value?.open) {
    dateRangeRef.value!.open = false
    rangePickerOpen.value = false
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
    :error="error"
    @close="emit('close')"
    @save="emit('save', { channelBudgetId: formData.channelBudgetId, amountCents: formData.amountCents, startDate: formData.startDate, endDate: formData.endDate, id: campaign?.id })"
    @delete="campaign && emit('delete', campaign.id)"
    @edit="localMode = 'edit'"
  >
    <EsInputsCommonBudgetSelect
      v-model="formData.budgetId"
      :budgets="budgets"
      :disabled="!isEditable"
    />

    <EsInputsCommonChannelSelect
      v-model="formData.channelId"
      :channels="availableChannels"
      :disabled="!isEditable || !formData.budgetId"
      :has-budget="!!formData.budgetId"
    />

    <EsInputsCommonFormField label="Date Range">
      <details
        ref="dateRangeRef"
        class="w-full"
        :class="{ 'pointer-events-none opacity-50': !isEditable || !formData.budgetId }"
        @toggle="onRangeToggle"
      >
        <summary class="input input-bordered rounded-lg border border-base-200 flex items-center cursor-pointer gap-2">
          <span :class="{ 'opacity-40': !dateRange.start }">{{ dateRange.start ? dateRange.start.toLocaleDateString()
            : 'Start date' }}</span>
          <span class="opacity-50">→</span>
          <span :class="{ 'opacity-40': !dateRange.end }">
            {{ dateRange.end ? dateRange.end.toLocaleDateString() : 'End date' }}
          </span>
        </summary>
      </details>
      <Teleport to="body">
        <div
          v-if="rangePickerOpen"
          ref="rangeCalendarRef"
          class="fixed z-[9999] rounded-box bg-base-100 shadow shadow-prometheus-orange/50"
          :style="rangePickerStyle"
        >
          <VDatePicker
            v-model.range="dateRange"
            mode="date"
            color="orange"
            :columns="1"
            :min-date="minDate"
            :max-date="maxDate"
            transparent
            borderless
          />
        </div>
      </Teleport>
    </EsInputsCommonFormField>

    <EsInputsCommonCentsInput
      v-model="formData.amountCents"
      label="Amount"
      :disabled="!isEditable"
    />
  </EsInputsCommonModalWrapper>
</template>

<style scoped>
summary {
  list-style: none;
}

summary::-webkit-details-marker {
  display: none;
}
</style>
