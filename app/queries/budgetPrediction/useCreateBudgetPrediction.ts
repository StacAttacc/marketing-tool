import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from '../queryKeys'

export function useCreateBudgetPrediction() {
  const orpc = useOrpc()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: {
      budgetId: string
      predictionPeriod: string
      totalBudgetCents: number
      channels: {
        channelId: string
        allocatedBudgetCents: number
        predictedRevenueCents?: number
        predictedUsersAcquired?: number
      }[]
    }) => orpc.budgetPrediction.create.call(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetPredictions })
    },
  })
}
