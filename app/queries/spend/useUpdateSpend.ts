import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from '../queryKeys'

export function useUpdateSpend() {
  const orpc = useOrpc()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: {
      id: string
      campaignId?: string
      amountCents?: number
      date?: string
    }) => orpc.spend.update.call(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.spends })
    },
  })
}
