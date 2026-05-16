<script setup lang="ts">
type CampaignOption = {
  id: string
  channelName: string
  budgetId: string
  budgetPeriod: string
  startDate: string
  endDate: string | null
}

const props = defineProps<{
  campaigns: CampaignOption[]
  disabled?: boolean
}>()

const modelValue = defineModel<string>({ required: true })

const selectedBudgetId = ref('')

const budgetPeriods = computed(() => {
  const seen = new Map<string, string>()
  for (const c of props.campaigns) {
    if (!seen.has(c.budgetId)) seen.set(c.budgetId, c.budgetPeriod)
  }
  return [...seen.entries()]
    .map(([id, label]) => ({ id, label }))
    .sort((a, b) => a.label.localeCompare(b.label))
})

const filteredCampaigns = computed(() =>
  selectedBudgetId.value
    ? props.campaigns.filter(c => c.budgetId === selectedBudgetId.value)
    : props.campaigns,
)

watch(selectedBudgetId, () => {
  if (!filteredCampaigns.value.some(c => c.id === modelValue.value)) {
    modelValue.value = ''
  }
})

function campaignLabel(c: CampaignOption) {
  return `${c.channelName} (${c.startDate} – ${c.endDate ?? '...'})`
}

const selectedBudgetLabel = computed(() =>
  budgetPeriods.value.find(bp => bp.id === selectedBudgetId.value)?.label ?? '',
)

const selectedCampaignLabel = computed(() => {
  const c = filteredCampaigns.value.find(c => c.id === modelValue.value)
  return c ? campaignLabel(c) : ''
})

const budgetRef = ref<HTMLDetailsElement>()
const campaignRef = ref<HTMLDetailsElement>()

function pickBudget(val: string) {
  selectedBudgetId.value = val
  if (budgetRef.value) budgetRef.value.open = false
}

function pickCampaign(val: string) {
  modelValue.value = val
  if (campaignRef.value) campaignRef.value.open = false
}

function closeIfOutside(ref: Ref<HTMLDetailsElement | undefined>, e: FocusEvent) {
  if (!ref.value?.contains(e.relatedTarget as Node))
    ref.value!.open = false
}
</script>

<template>
  <EsInputsCommonFormField label="Budget Period">
    <details
      ref="budgetRef"
      class="dropdown dropdown-bottom w-full rounded-lg border border-base-200 bg-base-100 flex items-center px-3 h-12 text-sm cursor-pointer"
      :class="{ 'opacity-50 pointer-events-none': disabled }"
      @focusout="closeIfOutside(budgetRef, $event)"
    >
      <summary
        class="flex-1 truncate"
        :class="{ 'text-base-content/40': !selectedBudgetLabel }"
      >
        {{ selectedBudgetLabel || 'All budget periods' }}
      </summary>
      <ul class="menu dropdown-content left-0 mt-1 bg-base-100 rounded-box shadow-md z-100 w-full p-1">
        <li>
          <a
            :class="{ active: selectedBudgetId === '' }"
            @click="pickBudget('')"
          >All budget periods</a>
        </li>
        <li
          v-for="bp in budgetPeriods"
          :key="bp.id"
        >
          <a
            :class="{ active: bp.id === selectedBudgetId }"
            @click="pickBudget(bp.id)"
          >{{ bp.label }}</a>
        </li>
      </ul>
    </details>
  </EsInputsCommonFormField>

  <EsInputsCommonFormField label="Campaign">
    <details
      ref="campaignRef"
      class="dropdown dropdown-bottom w-full rounded-lg border border-base-200 bg-base-100 flex items-center px-3 h-12 text-sm cursor-pointer"
      :class="{ 'opacity-50 pointer-events-none': disabled }"
      @focusout="closeIfOutside(campaignRef, $event)"
    >
      <summary
        class="flex-1 truncate"
        :class="{ 'text-base-content/40': !selectedCampaignLabel }"
      >
        {{ selectedCampaignLabel || 'Select a campaign' }}
      </summary>
      <ul class="menu dropdown-content left-0 mt-1 bg-base-100 rounded-box shadow-md z-100 w-full p-1">
        <li
          v-for="c in filteredCampaigns"
          :key="c.id"
        >
          <a
            :class="{ active: c.id === modelValue }"
            @click="pickCampaign(c.id)"
          >{{ campaignLabel(c) }}</a>
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
