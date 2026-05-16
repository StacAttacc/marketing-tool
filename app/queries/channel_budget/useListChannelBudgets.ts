import { useQuery } from '@tanstack/vue-query'
import { queryKeys } from '../queryKeys'

export function useListChannelBudgets() {
  return useQuery({
    queryKey: [...queryKeys.channelBudgets, 'all'],
    queryFn: () => useOrpc().channelBudget.list.call(),
  })
}
