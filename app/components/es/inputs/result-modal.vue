<script setup lang="ts">
type CampaignOption = {
  id: string
  channelBudgetId: string
  channelId: string
  channelName: string
  budgetId: string
  budgetPeriod: string
  startDate: string
  endDate: string | null
  amountCents: number
}

const props = defineProps<{
  isOpen: boolean
  mode: 'create' | 'view' | 'edit'
  error?: string | null
  result?: {
    id: string
    campaignId: string
    budgetId: string
    date: string
    revenueCents: number | null
    usersAcquired: number | null
  } | null
  campaigns: CampaignOption[]
}>()

const emit = defineEmits<{
  close: []
  save: [data: { campaignId: string, date: string, revenueCents: number, usersAcquired: number, id?: string }]
  delete: [resultId: string]
}>()

const formData = ref({
  campaignId: '',
  date: '',
  revenueCents: 0,
  usersAcquired: 0,
})

const localMode = ref<'create' | 'view' | 'edit'>('create')
const isEditable = computed(() => localMode.value !== 'view')

const selectedCampaign = computed(() =>
  props.campaigns.find(c => c.id === formData.value.campaignId) ?? null,
)

const minDate = computed(() =>
  selectedCampaign.value ? new Date(selectedCampaign.value.startDate) : undefined,
)

const maxDate = computed(() =>
  selectedCampaign.value?.endDate ? new Date(selectedCampaign.value.endDate) : undefined,
)

const isFormValid = computed(() =>
  formData.value.campaignId !== ''
  && formData.value.date !== ''
  && (formData.value.revenueCents > 0 || formData.value.usersAcquired > 0),
)

const title = computed(() => localMode.value === 'create' ? 'Add Revenue Entry' : 'Revenue Entry Details')

function initializeForm() {
  localMode.value = props.mode

  if (props.result && props.mode !== 'create') {
    formData.value = {
      campaignId: props.result.campaignId,
      date: props.result.date,
      revenueCents: props.result.revenueCents ?? 0,
      usersAcquired: props.result.usersAcquired ?? 0,
    }
  }
  else {
    formData.value = {
      campaignId: '',
      date: new Date().toISOString().split('T')[0]!,
      revenueCents: 0,
      usersAcquired: 0,
    }
  }
}

const dateObj = computed({
  get: () => formData.value.date ? new Date(formData.value.date) : null,
  set: (val: Date | null) => {
    formData.value.date = val ? val.toISOString().split('T')[0]! : ''
  },
})

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) initializeForm()
})

watch(() => props.mode, () => {
  if (props.isOpen) initializeForm()
})

const dateRef = ref<HTMLDetailsElement | null>(null)
const dateCalendarRef = ref<HTMLDivElement | null>(null)
const datePickerOpen = ref(false)
const datePickerPos = ref({ top: 0, left: 0 })

const datePickerStyle = computed(() => ({ top: `${datePickerPos.value.top}px`, left: `${datePickerPos.value.left}px` }))

function onDateToggle(e: Event) {
  datePickerOpen.value = (e.target as HTMLDetailsElement).open
  if (datePickerOpen.value && dateRef.value) {
    const rect = dateRef.value.getBoundingClientRect()
    datePickerPos.value = { top: rect.bottom + 4, left: Math.min(rect.left, window.innerWidth - 310) }
  }
}

watch(dateObj, (val) => {
  if (val && dateRef.value?.open) {
    dateRef.value.open = false
    datePickerOpen.value = false
  }
})

const handleDateClickOutside = (e: MouseEvent) => {
  if (datePickerOpen.value && !dateRef.value?.contains(e.target as Node) && !dateCalendarRef.value?.contains(e.target as Node)) {
    dateRef.value!.open = false
    datePickerOpen.value = false
  }
}

function closeDatePicker() {
  if (dateRef.value?.open) {
    dateRef.value!.open = false
    datePickerOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleDateClickOutside)
  window.addEventListener('resize', closeDatePicker)
})
onUnmounted(() => {
  document.removeEventListener('click', handleDateClickOutside)
  window.removeEventListener('resize', closeDatePicker)
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
    @save="emit('save', { ...formData, id: result?.id })"
    @delete="result && emit('delete', result.id)"
    @edit="localMode = 'edit'"
  >
    <EsInputsCommonCampaignSelect
      v-model="formData.campaignId"
      :campaigns="campaigns"
      :disabled="!isEditable"
    />

    <EsInputsCommonFormField label="Date">
      <details
        ref="dateRef"
        class="w-full"
        :class="{ 'pointer-events-none opacity-50': !isEditable || !formData.campaignId }"
        @toggle="onDateToggle"
      >
        <summary class="input input-bordered rounded-lg border border-base-200 flex items-center cursor-pointer">
          <span :class="{ 'opacity-40': !dateObj }">{{ dateObj ? dateObj.toLocaleDateString() : formData.campaignId
            ? 'Pick a date...' : 'Select a campaign first' }}</span>
        </summary>
      </details>
      <Teleport to="body">
        <div
          v-if="datePickerOpen"
          ref="dateCalendarRef"
          class="fixed z-[9999] rounded-box bg-base-100 shadow shadow-prometheus-orange/50"
          :style="datePickerStyle"
        >
          <VDatePicker
            v-model="dateObj"
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
      v-model="formData.revenueCents"
      label="Revenue"
      :disabled="!isEditable"
    />

    <EsInputsCommonFormField label="Users Acquired">
      <input
        v-model.number="formData.usersAcquired"
        type="number"
        min="0"
        step="1"
        placeholder="0"
        class="input input-bordered w-full rounded-lg border border-base-200 disabled:bg-base-100 disabled:text-base-content disabled:border-base-200 disabled:opacity-100"
        :disabled="!isEditable"
      >
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
</style>
