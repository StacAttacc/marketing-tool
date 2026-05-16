import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from '../queryKeys'

export function useCreateCampaign() {
  const orpc = useOrpc()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: {
      channelBudgetId: string
      amountCents: number
      startDate: string
      endDate?: string
    }) => orpc.campaign.create.call(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns })
    },
  })
}
