import { useQuery } from '@tanstack/vue-query'
import { queryKeys } from '../queryKeys'

export function useGetBudgetPredictionChannels(budgetPredictionId: Ref<string | null>) {
  const orpc = useOrpc()

  const queryOptions = computed(() =>
    orpc.budgetPrediction.getChannelPredictions.queryOptions({
      queryKey: [...queryKeys.budgetPredictions, 'channels', budgetPredictionId.value],
      input: { budgetPredictionId: budgetPredictionId.value ?? '' },
      enabled: !!budgetPredictionId.value,
    }),
  )

  return useQuery(queryOptions)
}
