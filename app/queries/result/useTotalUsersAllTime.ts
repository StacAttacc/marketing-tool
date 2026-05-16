import { useQuery } from '@tanstack/vue-query'
import { queryKeys } from '../queryKeys'

export function useTotalUsersAllTime() {
  return useQuery({
    queryKey: [...queryKeys.results, 'total-users'],
    queryFn: () => useOrpc().result.totalUsersAllTime.call(),
  })
}
