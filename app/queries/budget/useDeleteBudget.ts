import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from '../queryKeys'

export function useDeleteBudget() {
  const orpc = useOrpc()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => orpc.budget.delete.call({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets })
      queryClient.invalidateQueries({ queryKey: queryKeys.channelBudgets })
    },
  })
}
