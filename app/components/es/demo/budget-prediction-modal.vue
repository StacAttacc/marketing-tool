<script setup lang="ts">
import { useGetBudgetPredictionChannels } from '~/queries/budgetPrediction/useGetBudgetPredictionChannels'
import { useDeleteBudgetPrediction } from '~/queries/budgetPrediction/useDeleteBudgetPrediction'
import { formatCurrency } from '~/utils/formatCurrency'

const props = defineProps<{
  isOpen: boolean
  prediction: { id: string, predictionPeriod: string } | null
}>()

const emit = defineEmits<{
  close: []
}>()

const predictionIdRef = computed(() => props.prediction?.id ?? null)

const { data, isLoading } = useGetBudgetPredictionChannels(predictionIdRef)

const deleteError = ref<string | null>(null)
const { mutate: deletePrediction, isPending: isDeleting } = useDeleteBudgetPrediction()

function handleDelete() {
  if (!props.prediction) return
  deleteError.value = null
  deletePrediction(props.prediction.id, {
    onSuccess: () => emit('close'),
    onError: (err: Error) => { deleteError.value = err.message },
  })
}
</script>

<template>
  <EsInputsCommonModalWrapper
    :is-open="isOpen"
    :title="prediction?.predictionPeriod ?? 'Budget Prediction'"
    mode="prediction"
    :error="deleteError"
    @close="emit('close')"
    @delete="handleDelete"
  >
    <div
      v-if="isLoading || isDeleting"
      class="flex justify-center py-8"
    >
      <span class="loading loading-spinner loading-lg text-prometheus-orange" />
    </div>

    <template v-else>
      <table class="table table-sm w-full">
        <thead>
          <tr class="border-b border-base-300 text-base-content/60 text-xs uppercase tracking-wide">
            <th class="bg-transparent">
              <div class="flex items-center gap-1">
                <Icon name="lucide:megaphone" />
                Channel
              </div>
            </th>
            <th class="bg-transparent text-right">
              <div class="flex items-center justify-end gap-1">
                <Icon name="lucide:wallet" />
                Allocated
              </div>
            </th>
            <th class="bg-transparent text-right">
              <div class="flex items-center justify-end gap-1">
                <Icon name="lucide:banknote" />
                Revenue
              </div>
            </th>
            <th class="bg-transparent text-right">
              <div class="flex items-center justify-end gap-1">
                <Icon name="lucide:users" />
                Users
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="ch in data?.channels"
            :key="ch.id"
            class="border-b border-base-300/50"
          >
            <td class="font-medium">
              {{ ch.channelName }}
            </td>
            <td class="text-right tabular-nums">
              {{ formatCurrency(ch.allocatedBudgetCents) }}
            </td>
            <td class="text-right tabular-nums">
              {{ ch.predictedRevenueCents != null ? formatCurrency(ch.predictedRevenueCents) : '—' }}
            </td>
            <td class="text-right tabular-nums">
              {{ ch.predictedUsersAcquired != null ? ch.predictedUsersAcquired.toLocaleString('en-US') : '—' }}
            </td>
          </tr>
          <tr v-if="!data?.channels?.length">
            <td
              colspan="4"
              class="text-center py-6 text-base-content/50"
            >
              No channel predictions saved.
            </td>
          </tr>
        </tbody>
      </table>
    </template>
  </EsInputsCommonModalWrapper>
</template>
