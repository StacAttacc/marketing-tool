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
  spend?: {
    id: string
    campaignId: string
    budgetId: string
    date: string
    amountCents: number
  } | null
  campaigns: CampaignOption[]
}>()

const emit = defineEmits<{
  close: []
  save: [data: { campaignId: string, amountCents: number, date: string, id?: string }]
  delete: [spendId: string]
}>()

const formData = ref({
  campaignId: '',
  date: '',
  amountCents: 0,
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
  && formData.value.amountCents > 0,
)

const title = computed(() => localMode.value === 'create' ? 'Add Spend Entry' : 'Spend Entry Details')

function initializeForm() {
  localMode.value = props.mode

  if (props.spend && props.mode !== 'create') {
    formData.value = {
      campaignId: props.spend.campaignId,
      date: props.spend.date,
      amountCents: props.spend.amountCents,
    }
  }
  else {
    formData.value = {
      campaignId: '',
      date: new Date().toISOString().split('T')[0]!,
      amountCents: 0,
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
    @save="emit('save', { ...formData, id: spend?.id })"
    @delete="spend && emit('delete', spend.id)"
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
