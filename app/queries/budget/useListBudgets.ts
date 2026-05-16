import { useQuery } from '@tanstack/vue-query'
import { queryKeys } from '../queryKeys'

export function useListBudgets() {
  return useQuery({
    queryKey: [...queryKeys.budgets, 'all'],
    queryFn: () => useOrpc().budget.list.call(),
  })
}
