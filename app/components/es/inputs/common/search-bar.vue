<script setup lang="ts">
type SearchField = { value: string, label: string, type: 'text' | 'date' }

const props = defineProps<{ fields: SearchField[] }>()

const field = defineModel<string>('field', { required: true })
const value = defineModel<string>('value', { required: true })

const currentField = computed(() => props.fields.find(f => f.value === field.value))

const detailsRef = ref<HTMLDetailsElement>()

function select(val: string) {
  field.value = val
  if (detailsRef.value) detailsRef.value.open = false
}

function closeIfOutside(e: FocusEvent) {
  if (!detailsRef.value?.contains(e.relatedTarget as Node))
    detailsRef.value!.open = false
}

watch(field, () => {
  value.value = ''
})

const dateObj = computed({
  get: () => value.value ? new Date(value.value) : null,
  set: (val: Date | null) => {
    value.value = val ? val.toISOString().split('T')[0]! : ''
  },
})
</script>

<template>
  <div class="flex items-center p-0 m-2 rounded-lg border-2 border-base-300/50">
    <details
      ref="detailsRef"
      class="dropdown dropdown-bottom flex items-center gap-1 h-8 px-3 text-sm bg-base-200/50 rounded-l-lg rounded-r-none cursor-pointer"
      @focusout="closeIfOutside"
    >
      <summary class="label">
        <span class="text-base-content/50 text-xs">Search by</span>
        {{ currentField?.label }}
      </summary>
      <ul class="menu dropdown-content left-0 mt-1 bg-base-100 rounded-lg shadow-md z-100 w-full p-1">
        <li
          v-for="f in fields"
          :key="f.value"
        >
          <a
            :class="{ active: f.value === field }"
            @click="select(f.value)"
          >{{ f.label }}</a>
        </li>
      </ul>
    </details>
    <input
      v-if="currentField?.type === 'text'"
      v-model="value"
      type="text"
      class="input input-sm flex-1 bg-base-100 rounded-none"
      placeholder="Search..."
    >
    <VDatePicker
      v-else-if="currentField?.type === 'date'"
      v-model="dateObj"
      mode="date"
      color="orange"
      :popover="{ visibility: 'click' }"
    >
      <template #default="{ inputValue, inputEvents }">
        <input
          :value="inputValue"
          class="input input-sm flex-1 bg-base-100"
          placeholder="Pick a date..."
          readonly
          v-on="inputEvents"
        >
      </template>
    </VDatePicker>
  </div>
</template>

<style scoped>
details {
  position: relative;
  overflow: visible;
}
</style>
