import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from '../queryKeys'

export function useDeleteBudgetPrediction() {
  const orpc = useOrpc()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => orpc.budgetPrediction.delete.call({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetPredictions })
    },
  })
}
