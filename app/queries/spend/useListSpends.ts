import { useQuery } from '@tanstack/vue-query'
import { queryKeys } from '../queryKeys'

export function useListSpends() {
  return useQuery({
    queryKey: [...queryKeys.spends, 'all'],
    queryFn: () => useOrpc().spend.list.call(),
  })
}
