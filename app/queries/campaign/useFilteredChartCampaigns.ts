import { useQuery } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import { queryKeys } from '../queryKeys'

function toDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function useFilteredChartCampaigns(range?: MaybeRef<{ start: Date, end: Date } | undefined>) {
  const queryOptions = computed(() => {
    const r = toValue(range)
    const startDate = r ? toDateString(r.start) : undefined
    const endDate = r ? toDateString(r.end) : undefined
    return useOrpc().campaign.filter.queryOptions({
      queryKey: [...queryKeys.campaigns, 'chart', startDate ?? null, endDate ?? null],
      input: {
        limit: 100,
        offset: 0,
        sortBy: 'startDate',
        sortDirection: 'asc',
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      },
    })
  })
  return useQuery(queryOptions)
}
