import { useQuery } from '@tanstack/vue-query'
import { queryKeys } from '../queryKeys'

export function useListResults() {
  return useQuery({
    queryKey: queryKeys.results,
    queryFn: () => useOrpc().result.list.call(),
  })
}
