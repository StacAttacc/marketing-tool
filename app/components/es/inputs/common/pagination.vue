<script setup lang="ts">
defineProps<{
  page: number
  totalPages: number
  total: number
  hasMore: boolean
}>()

const emit = defineEmits<(e: 'prev' | 'next') => void>()
</script>

<template>
  <div
    v-if="totalPages > 1"
    class="flex items-center justify-between border-t border-base-300 p-4"
  >
    <span class="text-sm">
      Page {{ page }} of {{ totalPages }}
      <span class="opacity-70">({{ total }} total entries)</span>
    </span>
    <div class="flex gap-1.5">
      <button
        class="btn btn-sm border rounded-lg bg-transparent border-base-300 hover:bg-base-200"
        :disabled="page <= 1"
        @click="emit('prev')"
      >
        «
      </button>
      <button class="btn btn-sm rounded-lg bg-base-300 border-0">
        {{ page }}
      </button>
      <button
        class="btn btn-sm border rounded-lg bg-transparent border-base-300 hover:bg-base-200"
        :disabled="!hasMore"
        @click="emit('next')"
      >
        »
      </button>
    </div>
  </div>
</template>
