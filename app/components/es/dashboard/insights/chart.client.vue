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
  id: 'insights-chart',
  height: 400,
})

const { data: spendData, isLoading: spendLoading } = useFilteredChartSpends(computed(() => props.range))
const { data: resultData, isLoading: resultsLoading } = useFilteredChartResults(computed(() => props.range))
const { getColor } = useChannelColors()

const isLoading = computed(() => spendLoading.value || resultsLoading.value)

const chartData = computed(() => {
  if (!spendData.value?.spends || !resultData.value?.results) {
    return { series: [], categories: [] }
  }

  const channelSpendMap = new Map<string, Map<string, number>>()
  spendData.value.spends.forEach((s) => {
    if (!channelSpendMap.has(s.channelName)) channelSpendMap.set(s.channelName, new Map())
    const m = channelSpendMap.get(s.channelName)!
    m.set(s.date, (m.get(s.date) || 0) + (s.amountCents ?? 0))
  })

  const channelRevenueMap = new Map<string, Map<string, number>>()
  resultData.value.results.forEach((r) => {
    if (!channelRevenueMap.has(r.channelName)) channelRevenueMap.set(r.channelName, new Map())
    const m = channelRevenueMap.get(r.channelName)!
    m.set(r.date, (m.get(r.date) || 0) + (r.revenueCents ?? 0))
  })

  const channelNames = [...new Set([...channelSpendMap.keys(), ...channelRevenueMap.keys()])]

  const allDates = new Set<string>()
  spendData.value.spends.forEach(s => allDates.add(s.date))
  resultData.value.results.forEach(r => allDates.add(r.date))
  const sortedDates = [...allDates].sort()

  if (sortedDates.length === 1) {
    const prev = new Date(sortedDates[0]! + 'T00:00:00')
    prev.setDate(prev.getDate() - 1)
    sortedDates.unshift(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`)
  }

  const series: { name: string, type: string, data: number[], channel: string, metric: 'spend' | 'revenue' }[] = []

  channelNames.forEach((channelName) => {
    const spendMap = channelSpendMap.get(channelName) ?? new Map()
    const revenueMap = channelRevenueMap.get(channelName) ?? new Map()

    series.push({
      name: `${channelName} - Spend`,
      type: 'line',
      channel: channelName,
      metric: 'spend',
      data: sortedDates.map(d => (spendMap.get(d) || 0) / 100),
    })

    series.push({
      name: `${channelName} - Revenue`,
      type: 'line',
      channel: channelName,
      metric: 'revenue',
      data: sortedDates.map(d => (revenueMap.get(d) || 0) / 100),
    })
  })

  return { series, categories: sortedDates }
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
    curve: 'smooth',
    width: 2,
    dashArray: visibleSeries.value.map(s => s.metric === 'revenue' ? 5 : 0),
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
  yaxis: {
    min: 0,
    title: { text: 'Amount ($)' },
    labels: {
      formatter: (v: number) => `$${v.toFixed(0)}`,
    },
  },
  tooltip: {
    shared: true,
    intersect: false,
    x: {
      formatter: (val: number) => {
        const date = chartData.value.categories[val - 1]
        return date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
      },
    },
    y: {
      formatter: (v: number) => `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
    },
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
