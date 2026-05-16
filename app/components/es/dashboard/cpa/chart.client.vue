<script setup lang="ts">
import { useFilteredChartSpends } from '~/queries/spend/useFilteredChartSpends'
import { useFilteredChartResults } from '~/queries/result/useFilteredChartResults'
import { useChannelColors } from '~/composables/useChannelColors'

interface Props {
  id?: string
  height?: number | string
  range: { start: Date, end: Date }
  selectedChannel: string | null
}

const props = withDefaults(defineProps<Props>(), {
  id: 'cpa-chart',
  height: 400,
})

const { data: spendData, isLoading: spendLoading } = useFilteredChartSpends(computed(() => props.range))
const { data: resultData, isLoading: resultsLoading } = useFilteredChartResults(computed(() => props.range))
const { getColor } = useChannelColors()

const isLoading = computed(() => spendLoading.value || resultsLoading.value)

const chartData = computed(() => {
  if (!spendData.value?.spends || !resultData.value?.results) {
    return { series: [], categories: [], channelNames: [] }
  }

  const filteredSpends = spendData.value.spends
  const filteredResults = resultData.value.results

  const channelSpendMap = new Map<string, Map<string, number>>()
  filteredSpends.forEach((s) => {
    if (!channelSpendMap.has(s.channelName)) channelSpendMap.set(s.channelName, new Map())
    const m = channelSpendMap.get(s.channelName)!
    m.set(s.date, (m.get(s.date) || 0) + (s.amountCents ?? 0))
  })

  const channelUsersMap = new Map<string, Map<string, number>>()
  filteredResults.forEach((r) => {
    if (!channelUsersMap.has(r.channelName)) channelUsersMap.set(r.channelName, new Map())
    const m = channelUsersMap.get(r.channelName)!
    m.set(r.date, (m.get(r.date) || 0) + (r.usersAcquired ?? 0))
  })

  const channelNames = [...new Set([...channelSpendMap.keys(), ...channelUsersMap.keys()])]

  const allDates = new Set<string>()
  filteredSpends.forEach(s => allDates.add(s.date))
  filteredResults.forEach(r => allDates.add(r.date))
  const sortedDates = [...allDates].sort()

  if (sortedDates.length === 1) {
    const prev = new Date(sortedDates[0]! + 'T00:00:00')
    prev.setDate(prev.getDate() - 1)
    sortedDates.unshift(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`)
  }

  const series: { name: string, type: string, data: number[], channel: string, metric: 'spend' | 'users' }[] = []

  channelNames.forEach((channelName) => {
    const spendMap = channelSpendMap.get(channelName) ?? new Map()
    const usersMap = channelUsersMap.get(channelName) ?? new Map()

    series.push({
      name: `${channelName} - Spend`,
      type: 'line',
      channel: channelName,
      metric: 'spend',
      data: sortedDates.map(d => (spendMap.get(d) || 0) / 100),
    })

    series.push({
      name: `${channelName} - Users`,
      type: 'line',
      channel: channelName,
      metric: 'users',
      data: sortedDates.map(d => usersMap.get(d) || 0),
    })
  })

  return { series, categories: sortedDates, channelNames }
})

const visibleSeries = computed(() => {
  if (!props.selectedChannel) return chartData.value.series
  return chartData.value.series.filter(s => s.channel === props.selectedChannel)
})

const chartOptions = computed(() => ({
  chart: {
    id: props.id,
    type: 'line',
    stacked: false,
    toolbar: { show: false },
    zoom: { enabled: true, type: 'x', autoScaleYaxis: true },
  },
  colors: visibleSeries.value.map(s => getColor(s.channel)),
  dataLabels: { enabled: false },
  stroke: {
    curve: visibleSeries.value.map(s => s.metric === 'users' ? 'straight' : 'smooth'),
    width: 2,
    dashArray: visibleSeries.value.map(s => s.metric === 'users' ? 5 : 0),
  },
  legend: { show: false },
  xaxis: {
    type: 'category',
    categories: chartData.value.categories,
    tickAmount: 12,
    labels: {
      formatter: (val: string) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    },
  },
  yaxis: visibleSeries.value.map((s) => {
    const isSpend = s.metric === 'spend'
    const firstSpendName = visibleSeries.value.find(x => x.metric === 'spend')?.name
    const firstUsersName = visibleSeries.value.find(x => x.metric === 'users')?.name
    const anchorName = isSpend ? firstSpendName : firstUsersName
    const isFirstOfType = s.name === anchorName

    return {
      seriesName: anchorName,
      show: isFirstOfType,
      opposite: !isSpend,
      min: 0,
      forceNiceScale: !isSpend,
      title: isFirstOfType ? { text: isSpend ? 'Spend ($)' : 'Users Acquired' } : undefined,
      labels: {
        formatter: isSpend
          ? (v: number) => `$${v.toFixed(0)}`
          : (v: number) => Math.round(v).toString(),
      },
    }
  }),
  tooltip: {
    shared: true,
    intersect: false,
    x: { formatter: (val: number) => {
      const date = chartData.value.categories[val - 1]
      return date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
    } },
  },
}))
</script>

<template>
  <div class="rounded-xl bg-base-100 shadow shadow-base-300 p-4">
    <div
      v-if="isLoading"
      class="flex justify-center items-center"
      :style="{ height: props.height + 'px' }"
    >
      <span class="loading loading-spinner loading-lg text-prometheus-orange" />
    </div>
    <apexchart
      v-else-if="visibleSeries.length"
      :key="props.selectedChannel ?? 'all'"
      :height="props.height"
      :options="chartOptions"
      :series="visibleSeries"
    />
    <div
      v-else
      class="flex justify-center items-center text-gray-500"
      :style="{ height: props.height + 'px' }"
    >
      No data available for selected date range
    </div>
  </div>
</template>
