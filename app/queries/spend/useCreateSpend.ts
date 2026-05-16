import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from '../queryKeys'

export function useCreateSpend() {
  const orpc = useOrpc()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: {
      campaignId: string
      amountCents: number
      date: string
    }) => orpc.spend.create.call(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.spends })
    },
  })
}
