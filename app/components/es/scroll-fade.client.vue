<script setup lang="ts">
import { computed, ref } from 'vue'
import { useScrollEdgeFade } from '~/composables/useScrollEdgeFade'

const scrollEl = ref<HTMLElement | null>(null)
const { canScrollLeft, canScrollRight } = useScrollEdgeFade(scrollEl)

const FADE = '3rem'
const maskStyle = computed(() => {
  if (!canScrollLeft.value && !canScrollRight.value) return undefined
  const leftStop = canScrollLeft.value ? `transparent, black ${FADE}` : 'black, black'
  const rightStop = canScrollRight.value ? `black calc(100% - ${FADE}), transparent` : 'black, black'
  const mask = `linear-gradient(to right, ${leftStop}, ${rightStop})`
  return { maskImage: mask, WebkitMaskImage: mask }
})
</script>

<template>
  <div
    ref="scrollEl"
    class="overflow-x-auto scrollbar-hidden"
    :style="maskStyle"
  >
    <slot />
  </div>
</template>
