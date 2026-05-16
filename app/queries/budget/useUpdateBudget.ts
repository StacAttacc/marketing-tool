import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from '../queryKeys'

export function useUpdateBudget() {
  const orpc = useOrpc()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: {
      id: string
      budgetPeriod?: string
      totalBudgetCents?: number
      startDate?: string
      endDate?: string
      allocations?: { channelId: string, allocatedBudgetCents: number }[]
    }) => orpc.budget.update.call(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets })
      queryClient.invalidateQueries({ queryKey: queryKeys.channelBudgets })
    },
  })
}
