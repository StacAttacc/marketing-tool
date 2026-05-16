<script setup lang="ts">
defineProps<{
  label: string
}>()
</script>

<template>
  <fieldset class="fieldset">
    <legend class="fieldset-legend">
      {{ label }}
    </legend>
    <slot />
  </fieldset>
</template>
