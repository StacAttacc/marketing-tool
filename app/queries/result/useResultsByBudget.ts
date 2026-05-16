import { useQuery } from '@tanstack/vue-query'
import { queryKeys } from '../queryKeys'

export function useResultsByBudget(budgetId: Ref<string | null>) {
  const orpc = useOrpc()

  const queryOptions = computed(() =>
    orpc.result.filter.queryOptions({
      queryKey: [...queryKeys.results, 'byBudget', budgetId.value],
      input: {
        budgetId: budgetId.value ?? undefined,
        limit: 1000,
        offset: 0,
      },
      enabled: !!budgetId.value,
    }),
  )

  return useQuery(queryOptions)
}
