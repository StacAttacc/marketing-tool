import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from '../queryKeys'

export function useCreateBudget() {
  const orpc = useOrpc()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: {
      budgetPeriod: string
      totalBudgetCents: number
      startDate: string
      endDate: string
      allocations: { channelId: string, allocatedBudgetCents: number }[]
    }) => orpc.budget.create.call(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets })
      queryClient.invalidateQueries({ queryKey: queryKeys.channelBudgets })
    },
  })
}
