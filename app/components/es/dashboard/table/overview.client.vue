<script setup lang="ts">
import { useFilteredChartSpends } from '~/queries/spend/useFilteredChartSpends'
import { useFilteredChartResults } from '~/queries/result/useFilteredChartResults'
import { useChannelColors } from '~/composables/useChannelColors'

const props = defineProps<{
  syncRange?: { start: Date, end: Date }
}>()

const range = ref({
  start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
  end: new Date(),
})

watch(() => props.syncRange, (v) => {
  if (v) range.value = { start: new Date(v.start), end: new Date(v.end) }
}, { deep: true })

const { data: spendData, isLoading: spendLoading } = useFilteredChartSpends(range)
const { data: resultData, isLoading: resultsLoading } = useFilteredChartResults(range)
const { getColor } = useChannelColors()

const isLoading = computed(() => spendLoading.value || resultsLoading.value)

const rows = computed(() => {
  if (!spendData.value?.spends || !resultData.value?.results) return []

  const filteredSpends = spendData.value.spends
  const filteredResults = resultData.value.results

  const channelSpend = new Map<string, number>()
  filteredSpends.forEach(s =>
    channelSpend.set(s.channelName, (channelSpend.get(s.channelName) ?? 0) + (s.amountCents ?? 0)),
  )

  const channelRevenue = new Map<string, number>()
  const channelUsers = new Map<string, number>()
  filteredResults.forEach((r) => {
    channelRevenue.set(r.channelName, (channelRevenue.get(r.channelName) ?? 0) + (r.revenueCents ?? 0))
    channelUsers.set(r.channelName, (channelUsers.get(r.channelName) ?? 0) + (r.usersAcquired ?? 0))
  })

  const channelNames = [...new Set([...channelSpend.keys(), ...channelRevenue.keys()])].sort()

  return channelNames.map((name) => {
    const spend = (channelSpend.get(name) ?? 0) / 100
    const revenue = (channelRevenue.get(name) ?? 0) / 100
    const users = channelUsers.get(name) ?? 0
    const cpa = users > 0 ? spend / users : null
    const roi = spend > 0 ? (revenue - spend) / spend * 100 : null
    return { name, spend, revenue, users, cpa, roi }
  })
})

const totals = computed(() => {
  const spend = rows.value.reduce((s, r) => s + r.spend, 0)
  const revenue = rows.value.reduce((s, r) => s + r.revenue, 0)
  const users = rows.value.reduce((s, r) => s + r.users, 0)
  const cpa = users > 0 ? spend / users : null
  const roi = spend > 0 ? (revenue - spend) / spend * 100 : null
  return { spend, revenue, users, cpa, roi }
})

const fmtCurrency = (v: number) =>
  v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const fmtCpa = (v: number | null) =>
  v === null ? '—' : v.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtRoi = (v: number | null) =>
  v === null ? '—' : `${v.toFixed(1)}%`
</script>

<template>
  <div class="rounded-xl bg-base-200/50 p-4 shadow shadow-prometheus-orange/50">
    <div class="flex items-center gap-2 pb-3 mb-4 border-b border-base-300">
      <h3 class="shrink-0 sm:justify-between">
        Overview
      </h3>
      <div class="w-px h-5 bg-base-300 shrink-0 mx-1" />
      <EsDateRangePicker
        v-model="range"
        class="shrink-0"
      />
    </div>

    <div
      v-if="isLoading"
      class="flex justify-center items-center py-12"
    >
      <span class="loading loading-spinner loading-lg text-prometheus-orange" />
    </div>

    <EsScrollFade
      v-else-if="rows.length"
      class="rounded-xl bg-base-100 shadow shadow-base-300 p-4"
    >
      <table class="table table-sm w-full whitespace-nowrap">
        <thead>
          <tr class="border-b border-base-300 text-base-content/60 text-xs uppercase tracking-wide">
            <th class="bg-transparent">
              <div class="flex items-center gap-1">
                <Icon name="lucide:megaphone" />
                Channel
              </div>
            </th>
            <th class="bg-transparent text-right">
              <div class="flex items-center justify-end gap-1">
                <Icon name="lucide:dollar-sign" />
                Spend
              </div>
            </th>
            <th class="bg-transparent text-right">
              <div class="flex items-center justify-end gap-1">
                <Icon name="lucide:users" />
                Users
              </div>
            </th>
            <th class="bg-transparent text-right">
              <div class="flex items-center justify-end gap-1">
                <Icon name="lucide:target" />
                CPA
              </div>
            </th>
            <th class="bg-transparent text-right">
              <div class="flex items-center justify-end gap-1">
                <Icon name="lucide:banknote" />
                Revenue
              </div>
            </th>
            <th class="bg-transparent text-right">
              <div class="flex items-center justify-end gap-1">
                <Icon name="lucide:percent" />
                ROI
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.name"
            class="border-b border-base-300/50 hover:bg-base-300/30 transition-colors"
          >
            <td class="font-medium">
              <div class="flex items-center gap-2">
                <span
                  class="w-2.5 h-2.5 rounded-sm shrink-0"
                  :style="{ backgroundColor: getColor(row.name) }"
                />
                {{ row.name }}
              </div>
            </td>
            <td class="text-right tabular-nums">
              {{ fmtCurrency(row.spend) }}
            </td>
            <td class="text-right tabular-nums">
              {{ row.users.toLocaleString('en-US') }}
            </td>
            <td class="text-right tabular-nums">
              {{ fmtCpa(row.cpa) }}
            </td>
            <td class="text-right tabular-nums">
              {{ fmtCurrency(row.revenue) }}
            </td>
            <td class="text-right tabular-nums">
              {{ fmtRoi(row.roi) }}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="border-t-2 border-base-300 font-semibold">
            <td>Total</td>
            <td class="text-right tabular-nums">
              {{ fmtCurrency(totals.spend) }}
            </td>
            <td class="text-right tabular-nums">
              {{ totals.users.toLocaleString('en-US') }}
            </td>
            <td class="text-right tabular-nums">
              {{ fmtCpa(totals.cpa) }}
            </td>
            <td class="text-right tabular-nums">
              {{ fmtCurrency(totals.revenue) }}
            </td>
            <td class="text-right tabular-nums">
              {{ fmtRoi(totals.roi) }}
            </td>
          </tr>
        </tfoot>
      </table>
    </EsScrollFade>

    <div
      v-else
      class="flex justify-center items-center py-12 text-gray-500 text-sm rounded-xl bg-base-100 shadow shadow-base-300 px-4"
    >
      No data available for selected date range
    </div>
  </div>
</template>
