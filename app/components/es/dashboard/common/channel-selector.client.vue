<script setup lang="ts">
import { computed, ref } from 'vue'
import { useScrollEdgeFade } from '~/composables/useScrollEdgeFade'

defineProps<{
  channels: Array<{ name: string, color: string }>
}>()

const selected = defineModel<string | null>('selected', { required: true })

const scrollEl = ref<HTMLElement | null>(null)
const { canScrollLeft, canScrollRight } = useScrollEdgeFade(scrollEl)

const FADE = '6rem'
const maskStyle = computed(() => {
  if (!canScrollLeft.value && !canScrollRight.value) return undefined
  const leftStop = canScrollLeft.value ? `transparent, black ${FADE}` : 'black, black'
  const rightStop = canScrollRight.value ? `black calc(100% - ${FADE}), transparent` : 'black, black'
  const mask = `linear-gradient(to right, ${leftStop}, ${rightStop})`
  return { maskImage: mask, WebkitMaskImage: mask }
})

const select = (name: string | null) => {
  selected.value = selected.value === name ? null : name
}
</script>

<template>
  <div
    ref="scrollEl"
    class="overflow-x-auto scrollbar-hidden flex-1 min-w-0"
    :style="maskStyle"
  >
    <div class="flex gap-1.5 min-w-max">
      <button
        class="btn btn-sm border border-transparent rounded-lg"
        :class="selected === null ? 'bg-base-300' : 'bg-base-100 border-base-300 hover:bg-base-200'"
        @click="select(null)"
      >
        All
      </button>
      <button
        v-for="ch in channels"
        :key="ch.name"
        class="btn btn-sm border border-transparent rounded-lg"
        :class="selected === ch.name ? 'bg-base-300' : 'bg-base-100 border-base-300 hover:bg-base-200'"
        @click="select(ch.name)"
      >
        <span
          class="w-2.5 h-2.5 rounded-sm inline-block shrink-0"
          :style="{ backgroundColor: ch.color }"
        />
        {{ ch.name }}
      </button>
    </div>
  </div>
</template>
