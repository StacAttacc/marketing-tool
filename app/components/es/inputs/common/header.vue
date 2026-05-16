<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  buttonText?: string
  showButton?: boolean
}>(), {
  showButton: true,
})
const emit = defineEmits<(e: 'add') => void>()
</script>

<template>
  <div class="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-base-300">
    <h3 class="shrink-0">
      {{ title }}
    </h3>
    <button
      v-if="showButton"
      class="btn btn-sm border rounded-lg bg-transparent border-base-300 hover:bg-base-200"
      @click="emit('add')"
    >
      {{ buttonText ?? '+ Add Entry' }}
    </button>
  </div>
</template>
