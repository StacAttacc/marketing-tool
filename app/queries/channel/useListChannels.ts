import { useQuery } from '@tanstack/vue-query'
import { queryKeys } from '../queryKeys'

export function useListChannels() {
  return useQuery({
    queryKey: [...queryKeys.channels, 'all'],
    queryFn: () => useOrpc().channel.list.call(),
  })
}
