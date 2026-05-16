<script setup lang="ts">
import type { Channel } from '~~/server/database/schemas'

const props = defineProps<{
  channels: Channel[]
  disabled?: boolean
  hasBudget?: boolean
}>()

const modelValue = defineModel<string>({ required: true })

const selectedLabel = computed(() =>
  props.channels.find(c => c.id === modelValue.value)?.name ?? '',
)

const placeholder = computed(() =>
  props.hasBudget ? 'Select a channel' : 'Select a budget period first',
)

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
  <EsInputsCommonFormField label="Channel">
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
        {{ selectedLabel || placeholder }}
      </summary>
      <ul class="menu dropdown-content left-0 mt-1 bg-base-100 rounded-box shadow-md z-100 w-full p-1">
        <li v-if="hasBudget && channels.length === 0">
          <a class="pointer-events-none text-base-content/40">No channels allocated for this budget period</a>
        </li>
        <li
          v-for="c in channels"
          :key="c.id"
        >
          <a
            :class="{ active: c.id === modelValue }"
            @click="pick(c.id)"
          >{{ c.name }}</a>
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
