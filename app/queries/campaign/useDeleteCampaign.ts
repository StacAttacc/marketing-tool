import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from '../queryKeys'

export function useDeleteCampaign() {
  const orpc = useOrpc()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => orpc.campaign.delete.call({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns })
    },
  })
}
