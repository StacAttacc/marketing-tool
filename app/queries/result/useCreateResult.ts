import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from '../queryKeys'

export function useCreateResult() {
  const orpc = useOrpc()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: {
      campaignId: string
      date: string
      revenueCents?: number | null
      usersAcquired?: number | null
    }) => orpc.result.create.call(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.results })
    },
  })
}
