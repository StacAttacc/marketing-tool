import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { queryKeys } from '../queryKeys'

export function useDeleteSpend() {
  const orpc = useOrpc()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => orpc.spend.delete.call({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.spends })
    },
  })
}
