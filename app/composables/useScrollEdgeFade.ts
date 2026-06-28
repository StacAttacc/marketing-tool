import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

export function useScrollEdgeFade(elRef: Ref<HTMLElement | null>) {
  const canScrollLeft = ref(false)
  const canScrollRight = ref(false)

  const update = () => {
    const el = elRef.value
    if (!el) return
    canScrollLeft.value = el.scrollLeft > 0
    canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
  }

  let ro: ResizeObserver | null = null

  onMounted(() => {
    const el = elRef.value
    if (!el) return
    el.addEventListener('scroll', update, { passive: true })
    ro = new ResizeObserver(update)
    ro.observe(el)
    if (el.firstElementChild) ro.observe(el.firstElementChild)
    update()
  })

  onBeforeUnmount(() => {
    elRef.value?.removeEventListener('scroll', update)
    ro?.disconnect()
  })

  return { canScrollLeft, canScrollRight }
}
