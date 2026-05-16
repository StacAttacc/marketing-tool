<script setup lang="ts">
import { useFilteredListBudgetPredictions } from '~/queries/budgetPrediction/useFilteredListBudgetPredictions'
import { formatCurrency } from '~/utils/formatCurrency'

const props = defineProps<{
  budgetId?: string | null
}>()

const budgetIdRef = computed(() => props.budgetId ?? undefined)

const isModalOpen = ref(false)

const {
  data,
  isLoading,
  error,
  page,
  totalPages,
  sortBy,
  sortOrder,
  search,
  searchField,
  toggleSort,
  nextPage,
  prevPage,
} = useFilteredListBudgetPredictions(budgetIdRef)

type PredictionRow = NonNullable<typeof data.value>['predictions'][number]
const selectedPrediction = ref<PredictionRow | null>(null)

function openViewModal(prediction: PredictionRow) {
  selectedPrediction.value = prediction
  isModalOpen.value = true
}
</script>

<template>
  <div class="rounded-xl bg-base-200/50 p-4 shadow shadow-prometheus-orange/50">
    <div
      v-if="error"
      class="alert alert-error mb-4"
    >
      <span>{{ error instanceof Error ? error.message : String(error) }}</span>
    </div>

    <div
      v-if="isLoading"
      class="flex justify-center py-8"
    >
      <span class="loading loading-spinner loading-lg text-prometheus-orange" />
    </div>

    <template v-else>
      <div class="rounded-xl bg-base-100 shadow shadow-base-300 overflow-hidden">
        <EsInputsCommonSearchBar
          v-model:field="searchField"
          v-model:value="search"
          :fields="[
            { value: 'predictionPeriod', label: 'Prediction Period', type: 'text' },
            { value: 'budgetPeriod', label: 'Budget Period', type: 'text' },
          ]"
        />
        <div class="overflow-x-auto">
          <table class="table table-sm w-full text-center">
            <thead>
              <tr class="border-b border-base-300 text-base-content/60 text-xs uppercase tracking-wide">
                <th class="bg-transparent">
                  <button
                    class="flex items-center justify-center gap-1 w-full hover:text-base-content transition-colors"
                    @click="toggleSort('predictionPeriod')"
                  >
                    <Icon name="lucide:calendar" />
                    Prediction Period
                    <Icon
                      :name="sortBy === 'predictionPeriod' ? (sortOrder === 'asc' ? 'lucide:chevron-up' : 'lucide:chevron-down') : 'lucide:chevrons-up-down'"
                      :class="sortBy === 'predictionPeriod' ? 'opacity-100' : 'opacity-40'"
                    />
                  </button>
                </th>
                <th class="bg-transparent">
                  <div class="flex items-center justify-center gap-1">
                    <Icon name="lucide:calendar-range" />
                    Budget Period
                  </div>
                </th>
                <th class="bg-transparent">
                  <button
                    class="flex items-center justify-center gap-1 w-full hover:text-base-content transition-colors"
                    @click="toggleSort('totalBudgetCents')"
                  >
                    <Icon name="lucide:dollar-sign" />
                    Total Budget
                    <Icon
                      :name="sortBy === 'totalBudgetCents' ? (sortOrder === 'asc' ? 'lucide:chevron-up' : 'lucide:chevron-down') : 'lucide:chevrons-up-down'"
                      :class="sortBy === 'totalBudgetCents' ? 'opacity-100' : 'opacity-40'"
                    />
                  </button>
                </th>
                <th class="bg-transparent">
                  <div class="flex items-center justify-center gap-1">
                    <Icon name="lucide:wallet" />
                    Allocated Budget
                  </div>
                </th>
                <th class="bg-transparent">
                  <div class="flex items-center justify-center gap-1">
                    <Icon name="lucide:banknote" />
                    Predicted Revenue
                  </div>
                </th>
                <th class="bg-transparent">
                  <div class="flex items-center justify-center gap-1">
                    <Icon name="lucide:users" />
                    Predicted Users
                  </div>
                </th>
                <th class="bg-transparent">
                  <div class="flex items-center justify-center gap-1">
                    <Icon name="lucide:settings" />
                    Actions
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="prediction in data?.predictions"
                :key="prediction.id"
                class="border-b border-base-300/50 hover:bg-base-300/30 transition-colors"
              >
                <td>{{ prediction.predictionPeriod }}</td>
                <td>{{ prediction.budgetPeriod }}</td>
                <td>{{ formatCurrency(prediction.totalBudgetCents) }}</td>
                <td>{{ formatCurrency(prediction.allocatedBudgetCents) }}</td>
                <td>{{ formatCurrency(prediction.predictedRevenueCents) }}</td>
                <td>{{ prediction.predictedUsersAcquired.toLocaleString('en-US') }}</td>
                <td>
                  <button
                    class="btn btn-sm border rounded-lg bg-transparent border-base-300 hover:bg-base-200"
                    @click="openViewModal(prediction)"
                  >
                    <Icon name="lucide:eye" />
                  </button>
                </td>
              </tr>
              <tr v-if="!data?.predictions?.length">
                <td
                  colspan="7"
                  class="text-center py-8 text-base-content/50"
                >
                  No predictions found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <EsInputsCommonPagination
          :page="page"
          :total-pages="totalPages"
          :total="data?.pagination?.total ?? 0"
          :has-more="data?.pagination?.hasMore ?? false"
          @prev="prevPage"
          @next="nextPage"
        />
      </div>

      <EsDemoBudgetPredictionModal
        :is-open="isModalOpen"
        :prediction="selectedPrediction"
        @close="isModalOpen = false"
      />
    </template>
  </div>
</template>
