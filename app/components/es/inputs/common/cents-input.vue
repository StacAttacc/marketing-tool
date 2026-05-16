<script setup lang="ts">
const props = defineProps<{
  label: string
  disabled?: boolean
  currency?: string
}>()

const modelValue = defineModel<number>({ required: true })

const localValue = computed({
  get: () => modelValue.value,
  set: (val: number | string) => {
    modelValue.value = val === '' || val === null || val === undefined ? 0 : Number(val)
  },
})

const formatted = computed(() => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: props.currency ?? 'CAD',
  }).format(modelValue.value / 100)
})
</script>

<template>
  <EsInputsCommonFormField :label="label">
    <div class="flex items-center gap-4">
      <input
        v-model.number="localValue"
        type="number"
        min="0"
        step="1"
        placeholder="0"
        class="input input-bordered flex-1 rounded-lg border border-base-200 disabled:bg-base-100 disabled:text-base-content disabled:border-base-200 disabled:opacity-100"
        :disabled="disabled"
      >
      <span class="text-sm opacity-70 w-24 text-right">
        {{ formatted }}
      </span>
    </div>
  </EsInputsCommonFormField>
</template>
