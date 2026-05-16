import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from '../queryKeys'

export function useUpdateResult() {
  const orpc = useOrpc()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: {
      id: string
      campaignId?: string
      date?: string
      revenueCents?: number | null
      usersAcquired?: number | null
    }) => orpc.result.update.call(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.results })
    },
  })
}
