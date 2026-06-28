<script setup lang="ts">
defineProps<{
  label: string
  value: string
  isLoading?: boolean
}>()
</script>

<template>
  <div class="rounded-xl bg-base-100 shadow shadow-base-300 p-4 flex flex-col justify-center items-center gap-1 h-full">
    <span class="text-sm text-gray-500">{{ label }}</span>
    <span
      v-if="isLoading"
      class="loading loading-spinner loading-md text-prometheus-orange"
    />
    <span
      v-else
      class="text-2xl font-semibold"
    >
      {{ value }}
    </span>
  </div>
</template>
