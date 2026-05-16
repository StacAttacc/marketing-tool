<script setup lang="ts">
import { useChannelColors } from '~/composables/useChannelColors'
import { useFilteredChartResults } from '~/queries/result/useFilteredChartResults'

interface Props {
  id?: string
  title?: string
  height?: number | string
}

interface RangeProps {
  range: { start: Date, end: Date }
  selectedChannel: string | null
}

const props = withDefaults(defineProps<Props & RangeProps>(), {
  id: 'results-growth-chart',
  title: 'Revenue & User Growth Over Time',
  height: 400,
})

const { data: resultData, isLoading } = useFilteredChartResults(computed(() => props.range))
const { getColor } = useChannelColors()

const chartData = computed(() => {
  if (!resultData.value?.results) return { series: [], categories: [], channelNames: [] }

  const filteredResults = resultData.value.results

  const channelRevenueMap = new Map<string, Map<string, number>>()
  const channelUsersMap = new Map<string, Map<string, number>>()

  filteredResults.forEach((result) => {
    const dateKey = result.date

    if (!channelRevenueMap.has(result.channelName)) {
      channelRevenueMap.set(result.channelName, new Map())
    }
    const revenueDateMap = channelRevenueMap.get(result.channelName)!
    const currentRevenue = revenueDateMap.get(dateKey) || 0
    revenueDateMap.set(dateKey, currentRevenue + (result.revenueCents ?? 0))

    if (!channelUsersMap.has(result.channelName)) {
      channelUsersMap.set(result.channelName, new Map())
    }
    const usersDateMap = channelUsersMap.get(result.channelName)!
    const currentUsers = usersDateMap.get(dateKey) || 0
    usersDateMap.set(dateKey, currentUsers + (result.usersAcquired ?? 0))
  })

  const allDates = new Set<string>()
  filteredResults.forEach(result => allDates.add(result.date))
  const sortedDates = Array.from(allDates).sort()

  if (sortedDates.length === 1) {
    const prev = new Date(sortedDates[0]! + 'T00:00:00')
    prev.setDate(prev.getDate() - 1)
    sortedDates.unshift(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`)
  }

  const channelNames = Array.from(channelRevenueMap.keys())

  const series: { name: string, type: string, data: number[], channel: string, metric: 'revenue' | 'users' }[] = []

  channelNames.forEach((channelName) => {
    const revenueDateMap = channelRevenueMap.get(channelName)!
    const usersDateMap = channelUsersMap.get(channelName)!

    series.push({
      name: `${channelName} - Revenue`,
      type: 'line',
      channel: channelName,
      metric: 'revenue',
      data: sortedDates.map(date => (revenueDateMap.get(date) || 0) / 100),
    })

    series.push({
      name: `${channelName} - Users`,
      type: 'line',
      channel: channelName,
      metric: 'users',
      data: sortedDates.map(date => usersDateMap.get(date) || 0),
    })
  })

  return {
    series,
    categories: sortedDates,
    channelNames,
  }
})

const visibleSeries = computed(() => {
  if (!props.selectedChannel) {
    return chartData.value.series
  }
  return chartData.value.series.filter(s => s.channel === props.selectedChannel)
})

const chartOptions = computed(() => {
  return {
    chart: {
      id: props.id,
      type: 'line',
      stacked: false,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: true,
        type: 'x',
        autoScaleYaxis: true,
      },
    },
    colors: visibleSeries.value.map(s => getColor(s.channel)),
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: visibleSeries.value.map(s => s.metric === 'users' ? 'straight' : 'smooth'),
      width: 2,
      dashArray: visibleSeries.value.map(s => s.metric === 'users' ? 5 : 0),
    },
    legend: {
      show: false,
    },
    xaxis: {
      type: 'category',
      categories: chartData.value.categories,
      tickAmount: 12,
      labels: {
        formatter: (val: string) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      },
    },
    yaxis: visibleSeries.value.map((s) => {
      const isRevenue = s.metric === 'revenue'
      const firstRevenueName = visibleSeries.value.find(x => x.metric === 'revenue')?.name
      const firstUsersName = visibleSeries.value.find(x => x.metric === 'users')?.name
      const anchorName = isRevenue ? firstRevenueName : firstUsersName
      const isFirstOfType = s.name === anchorName

      return {
        seriesName: anchorName,
        show: isFirstOfType,
        opposite: !isRevenue,
        min: 0,
        forceNiceScale: !isRevenue,
        title: isFirstOfType ? { text: isRevenue ? 'Revenue ($)' : 'Users Acquired' } : undefined,
        labels: {
          formatter: isRevenue
            ? (value: number) => `$${value.toFixed(0)}`
            : (value: number) => Math.round(value).toString(),
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
  }
})
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
