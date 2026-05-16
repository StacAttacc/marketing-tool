import { useChannelColors } from '~/composables/useChannelColors'

interface OverviewSectionProps {
  syncRange?: { start: Date, end: Date }
  syncChannel?: string | null
}

export function useOverviewSection(props: OverviewSectionProps) {
  const range = ref({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    end: new Date(),
  })

  const selectedChannel = ref<string | null>(null)

  watch(() => props.syncRange, (v) => {
    if (v) range.value = { start: new Date(v.start), end: new Date(v.end) }
  }, { deep: true })

  watch(() => props.syncChannel, (v) => {
    if (v !== undefined) selectedChannel.value = v
  })

  const { channelColors } = useChannelColors()

  const selectChannel = (channelName: string | null) => {
    selectedChannel.value = selectedChannel.value === channelName ? null : channelName
  }

  return { range, selectedChannel, channelColors, selectChannel }
}
