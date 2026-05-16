import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from '../queryKeys'

export function useUpdateCampaign() {
  const orpc = useOrpc()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: {
      id: string
      channelBudgetId?: string
      amountCents?: number
      startDate?: string
      endDate?: string | null
    }) => orpc.campaign.update.call(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns })
    },
  })
}
