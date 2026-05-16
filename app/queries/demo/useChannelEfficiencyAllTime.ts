import { useQuery } from '@tanstack/vue-query'
import { queryKeys } from '../queryKeys'

export function useChannelEfficiencyAllTime() {
  const orpc = useOrpc()

  const queryOptions = computed(() =>
    orpc.demo.channelEfficiencyAllTime.queryOptions({
      queryKey: [...queryKeys.demo, 'channelEfficiencyAllTime'],
    }),
  )

  return useQuery(queryOptions)
}
