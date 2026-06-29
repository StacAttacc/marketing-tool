<script setup lang="ts">
import { useFilteredListBudgets } from '~/queries/budget/useFilteredListBudgets'
import { useListChannels } from '~/queries/channel/useListChannels'
import { useListChannelBudgets } from '~/queries/channel_budget/useListChannelBudgets'
import { useCreateBudget } from '~/queries/budget/useCreateBudget'
import { useUpdateBudget } from '~/queries/budget/useUpdateBudget'
import { useDeleteBudget } from '~/queries/budget/useDeleteBudget'
import { formatCurrency } from '~/utils/formatCurrency'

import type { Budget } from '~~/server/database/schemas'

const {
  data,
  isLoading,
  error,
  page,
  totalPages,
  search,
  searchField,
  sortBy,
  sortOrder,
  toggleSort,
  nextPage,
  prevPage,
} = useFilteredListBudgets()

const { data: channelData, isLoading: channelsLoading, error: channelsError } = useListChannels()
const { data: channelBudgetData, isLoading: channelBudgetsLoading, error: channelBudgetsError } = useListChannelBudgets()

const budgets = computed(() => data.value?.budgets ?? [])
const channels = computed(() => channelData.value?.channels ?? [])
const channelBudgets = computed(() => channelBudgetData.value?.channelBudgets ?? [])

const combinedLoading = computed(() => isLoading.value || channelsLoading.value || channelBudgetsLoading.value)
const combinedError = computed(() => error.value?.message ?? channelsError.value?.message ?? channelBudgetsError.value?.message ?? null)

const isModalOpen = ref(false)
const modalMode = ref<'create' | 'view' | 'edit'>('create')
const selectedBudget = ref<Budget | null>(null)

const createBudget = useCreateBudget()
const updateBudget = useUpdateBudget()
const deleteBudget = useDeleteBudget()

const mutationError = ref<string | null>(null)

function openCreateModal() {
  modalMode.value = 'create'
  selectedBudget.value = null
  isModalOpen.value = true
}

function openViewModal(budget: Budget) {
  modalMode.value = 'view'
  selectedBudget.value = budget
  isModalOpen.value = true
}

function handleModalClose() {
  isModalOpen.value = false
}

function handleSave(data: {
  budgetPeriod: string
  startDate: string
  endDate: string
  totalBudgetCents: number
  id?: string
  allocations: { channelId: string, allocatedBudgetCents: number }[]
}) {
  mutationError.value = null
  const callbacks = {
    onSuccess: () => { isModalOpen.value = false },
    onError: (err: Error) => { mutationError.value = err.message },
  }
  if (modalMode.value === 'create') {
    createBudget.mutate({ budgetPeriod: data.budgetPeriod, startDate: data.startDate, endDate: data.endDate, totalBudgetCents: data.totalBudgetCents, allocations: data.allocations }, callbacks)
  }
  else {
    updateBudget.mutate({ id: data.id!, budgetPeriod: data.budgetPeriod, startDate: data.startDate, endDate: data.endDate, totalBudgetCents: data.totalBudgetCents, allocations: data.allocations }, callbacks)
  }
}

function handleDelete(budgetId: string) {
  deleteBudget.mutate(budgetId, {
    onSuccess: () => { isModalOpen.value = false },
    onError: (err: Error) => { mutationError.value = err.message },
  })
}
</script>

<template>
  <div class="rounded-xl bg-base-200/50 p-4 shadow shadow-prometheus-orange/50">
    <div
      v-if="combinedError"
      class="alert alert-error mb-4"
    >
      <span>{{ combinedError }}</span>
    </div>

    <div
      v-if="mutationError"
      class="alert alert-error mb-4"
    >
      <span>{{ mutationError }}</span>
    </div>

    <div
      v-if="combinedLoading"
      class="flex justify-center py-8"
    >
      <span class="loading loading-spinner loading-lg text-prometheus-orange" />
    </div>

    <template v-else>
      <EsInputsCommonHeader
        title="Manage your budgets"
        button-text="+ New Budget"
        @add="openCreateModal"
      />
      <div class="rounded-xl bg-base-100 shadow shadow-base-300 overflow-hidden">
        <EsInputsCommonSearchBar
          v-model:field="searchField"
          v-model:value="search"
          :fields="[
            { value: 'budgetPeriod', label: 'Budget Period', type: 'text' },
            { value: 'date', label: 'Date', type: 'date' },
          ]"
        />
        <EsScrollFade>
          <table class="table table-sm w-full text-center whitespace-nowrap">
            <thead>
              <tr class="border-b border-base-300 text-base-content/60 text-xs uppercase tracking-wide">
                <th class="bg-transparent">
                  <button
                    class="flex items-center justify-center gap-1 w-full hover:text-base-content transition-colors"
                    @click="toggleSort('budgetPeriod')"
                  >
                    <Icon name="lucide:calendar-range" />
                    Period
                    <Icon
                      :name="sortBy === 'budgetPeriod' ? (sortOrder === 'asc' ? 'lucide:chevron-up' : 'lucide:chevron-down') : 'lucide:chevrons-up-down'"
                      :class="sortBy === 'budgetPeriod' ? 'opacity-100' : 'opacity-40'"
                    />
                  </button>
                </th>
                <th class="bg-transparent">
                  <button
                    class="flex items-center justify-center gap-1 w-full hover:text-base-content transition-colors"
                    @click="toggleSort('startDate')"
                  >
                    <Icon name="lucide:calendar-days" />
                    Date Range
                    <Icon
                      :name="sortBy === 'startDate' ? (sortOrder === 'asc' ? 'lucide:chevron-up' : 'lucide:chevron-down') : 'lucide:chevrons-up-down'"
                      :class="sortBy === 'startDate' ? 'opacity-100' : 'opacity-40'"
                    />
                  </button>
                </th>
                <th class="bg-transparent">
                  <button
                    class="flex items-center justify-center gap-1 w-full hover:text-base-content transition-colors"
                    @click="toggleSort('totalBudgetCents')"
                  >
                    <Icon name="lucide:piggy-bank" />
                    Total Budget
                    <Icon
                      :name="sortBy === 'totalBudgetCents' ? (sortOrder === 'asc' ? 'lucide:chevron-up' : 'lucide:chevron-down') : 'lucide:chevrons-up-down'"
                      :class="sortBy === 'totalBudgetCents' ? 'opacity-100' : 'opacity-40'"
                    />
                  </button>
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
                v-for="budget in budgets"
                :key="budget.id"
                class="border-b border-base-300/50 hover:bg-base-300/30 transition-colors"
              >
                <td>{{ budget.budgetPeriod }}</td>
                <td>{{ budget.startDate }} - {{ budget.endDate }}</td>
                <td>{{ formatCurrency(budget.totalBudgetCents) }}</td>
                <td>
                  <button
                    class="btn btn-sm border rounded-lg bg-transparent border-base-300 hover:bg-base-200"
                    @click="openViewModal(budget)"
                  >
                    <Icon name="lucide:eye" />
                  </button>
                </td>
              </tr>
              <tr v-if="budgets.length === 0">
                <td
                  colspan="4"
                  class="text-center py-8 text-base-content/50"
                >
                  No budget periods found.
                </td>
              </tr>
            </tbody>
          </table>
        </EsScrollFade>

        <EsInputsCommonPagination
          :page="page"
          :total-pages="totalPages"
          :total="data?.pagination?.total ?? 0"
          :has-more="data?.pagination?.hasMore ?? false"
          @prev="prevPage"
          @next="nextPage"
        />
      </div>

      <EsInputsBudgetModal
        :is-open="isModalOpen"
        :mode="modalMode"
        :budget="selectedBudget"
        :channels="channels"
        :channel-budgets="channelBudgets"
        @close="handleModalClose"
        @save="handleSave"
        @delete="handleDelete"
      />
    </template>
  </div>
</template>
