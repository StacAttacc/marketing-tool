import { useQuery } from '@tanstack/vue-query'
import { queryKeys } from '../queryKeys'
import type { Ref } from 'vue'

export function useChannelEfficiency(budgetId: Ref<string | null>) {
  const orpc = useOrpc()

  const queryOptions = computed(() =>
    orpc.demo.channelEfficiency.queryOptions({
      queryKey: [...queryKeys.demo, 'channelEfficiency', budgetId.value],
      input: { budgetId: budgetId.value! },
      enabled: !!budgetId.value,
    }),
  )

  return useQuery(queryOptions)
}
