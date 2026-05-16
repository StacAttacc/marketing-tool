import { useQuery } from '@tanstack/vue-query'
import { queryKeys } from '../queryKeys'

export function useListCampaigns() {
  return useQuery({
    queryKey: [...queryKeys.campaigns, 'all'],
    queryFn: () => useOrpc().campaign.list.call(),
  })
}
