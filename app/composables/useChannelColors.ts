import { useListChannels } from '~/queries/channel/useListChannels'

// Wong (2011) palette — distinguishable under deuteranopia, protanopia, and tritanopia
export const CHART_COLORS = [
  '#E69F00', // orange
  '#56B4E9', // sky blue
  '#009E73', // bluish green
  '#0072B2', // blue
  '#D55E00', // vermilion
  '#CC79A7', // reddish purple
  '#F0E442', // yellow
  '#000000', // black
] as const

export function useChannelColors() {
  const { data: channelData } = useListChannels()

  const channelNames = computed(() =>
    [...(channelData.value?.channels ?? [])].map(c => c.name).sort(),
  )

  const colorMap = computed(() =>
    new Map(channelNames.value.map((name, i) => [name, CHART_COLORS[i % CHART_COLORS.length]])),
  )

  const channelColors = computed(() =>
    channelNames.value.map(name => ({ name, color: colorMap.value.get(name)! })),
  )

  const getColor = (channelName: string) =>
    colorMap.value.get(channelName) ?? CHART_COLORS[0]

  return { channelColors, getColor }
}
