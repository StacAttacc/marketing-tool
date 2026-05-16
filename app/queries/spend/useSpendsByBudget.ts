import { useQuery } from '@tanstack/vue-query'
import { queryKeys } from '../queryKeys'

export function useSpendsByBudget(budgetId: Ref<string | null>) {
  const orpc = useOrpc()

  const queryOptions = computed(() =>
    orpc.spend.filter.queryOptions({
      queryKey: [...queryKeys.spends, 'byBudget', budgetId.value],
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
