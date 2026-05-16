<script setup lang="ts">
import { useFilteredListResults } from '~/queries/result/useFilteredListResults'
import { useListCampaigns } from '~/queries/campaign/useListCampaigns'
import { useCreateResult } from '~/queries/result/useCreateResult'
import { useUpdateResult } from '~/queries/result/useUpdateResult'
import { useDeleteResult } from '~/queries/result/useDeleteResult'
import { formatCurrency } from '~/utils/formatCurrency'

const isModalOpen = ref(false)
const modalMode = ref<'create' | 'view' | 'edit'>('create')

const campaignsQuery = useListCampaigns()
const campaigns = computed(() => campaignsQuery.data.value?.campaigns ?? [])

const createResult = useCreateResult()
const updateResult = useUpdateResult()
const deleteResult = useDeleteResult()

const mutationError = ref<string | null>(null)

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
} = useFilteredListResults()

type ResultRow = NonNullable<typeof data.value>['results'][number]
const selectedResult = ref<ResultRow | null>(null)

function openCreateModal() {
  modalMode.value = 'create'
  selectedResult.value = null
  isModalOpen.value = true
}

function openViewModal(result: ResultRow) {
  modalMode.value = 'view'
  selectedResult.value = result
  isModalOpen.value = true
}

function handleSave(data: { campaignId: string, revenueCents: number, usersAcquired: number, date: string, id?: string }) {
  mutationError.value = null
  const callbacks = {
    onSuccess: () => { isModalOpen.value = false },
    onError: (err: Error) => { mutationError.value = err.message },
  }
  if (modalMode.value === 'create') {
    createResult.mutate({ campaignId: data.campaignId, revenueCents: data.revenueCents, usersAcquired: data.usersAcquired, date: data.date }, callbacks)
  }
  else {
    updateResult.mutate({ id: data.id!, campaignId: data.campaignId, revenueCents: data.revenueCents, usersAcquired: data.usersAcquired, date: data.date }, callbacks)
  }
}

function handleDelete(resultId: string) {
  deleteResult.mutate(resultId, {
    onSuccess: () => { isModalOpen.value = false },
    onError: (err: Error) => { mutationError.value = err.message },
  })
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
      v-if="mutationError"
      class="alert alert-error mb-4"
    >
      <span>{{ mutationError }}</span>
    </div>

    <div
      v-if="isLoading"
      class="flex justify-center py-8"
    >
      <span class="loading loading-spinner loading-lg text-prometheus-orange" />
    </div>

    <template v-else>
      <EsInputsCommonHeader
        title="Manage your results"
        button-text="+ New Result"
        @add="openCreateModal"
      />
      <div class="rounded-xl bg-base-100 shadow shadow-base-300 overflow-hidden">
        <EsInputsCommonSearchBar
          v-model:field="searchField"
          v-model:value="search"
          :fields="[
            { value: 'channel', label: 'Channel', type: 'text' },
            { value: 'date', label: 'Date', type: 'date' },
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
                    @click="toggleSort('channel')"
                  >
                    <Icon name="lucide:megaphone" />
                    Channel
                    <Icon
                      :name="sortBy === 'channel' ? (sortOrder === 'asc' ? 'lucide:chevron-up' : 'lucide:chevron-down') : 'lucide:chevrons-up-down'"
                      :class="sortBy === 'channel' ? 'opacity-100' : 'opacity-40'"
                    />
                  </button>
                </th>
                <th class="bg-transparent">
                  <button
                    class="flex items-center justify-center gap-1 w-full hover:text-base-content transition-colors"
                    @click="toggleSort('date')"
                  >
                    <Icon name="lucide:calendar" />
                    Date
                    <Icon
                      :name="sortBy === 'date' ? (sortOrder === 'asc' ? 'lucide:chevron-up' : 'lucide:chevron-down') : 'lucide:chevrons-up-down'"
                      :class="sortBy === 'date' ? 'opacity-100' : 'opacity-40'"
                    />
                  </button>
                </th>
                <th class="bg-transparent">
                  <button
                    class="flex items-center justify-center gap-1 w-full hover:text-base-content transition-colors"
                    @click="toggleSort('revenueCents')"
                  >
                    <Icon name="lucide:dollar-sign" />
                    Revenue
                    <Icon
                      :name="sortBy === 'revenueCents' ? (sortOrder === 'asc' ? 'lucide:chevron-up' : 'lucide:chevron-down') : 'lucide:chevrons-up-down'"
                      :class="sortBy === 'revenueCents' ? 'opacity-100' : 'opacity-40'"
                    />
                  </button>
                </th>
                <th class="bg-transparent">
                  <button
                    class="flex items-center justify-center gap-1 w-full hover:text-base-content transition-colors"
                    @click="toggleSort('usersAcquired')"
                  >
                    <Icon name="lucide:users" />
                    Users Acquired
                    <Icon
                      :name="sortBy === 'usersAcquired' ? (sortOrder === 'asc' ? 'lucide:chevron-up' : 'lucide:chevron-down') : 'lucide:chevrons-up-down'"
                      :class="sortBy === 'usersAcquired' ? 'opacity-100' : 'opacity-40'"
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
                v-for="result in data?.results"
                :key="result.id"
                class="border-b border-base-300/50 hover:bg-base-300/30 transition-colors"
              >
                <td>{{ result.channelName }}</td>
                <td>{{ new Date(result.date).toLocaleDateString() }}</td>
                <td>{{ formatCurrency(result.revenueCents) }}</td>
                <td>{{ result.usersAcquired ?? '-' }}</td>
                <td>
                  <button
                    class="btn btn-sm border rounded-lg bg-transparent border-base-300 hover:bg-base-200"
                    @click="openViewModal(result)"
                  >
                    <Icon name="lucide:eye" />
                  </button>
                </td>
              </tr>
              <tr v-if="!data?.results?.length">
                <td
                  colspan="5"
                  class="text-center py-8 text-base-content/50"
                >
                  No results found.
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

      <EsInputsResultModal
        :is-open="isModalOpen"
        :mode="modalMode"
        :error="mutationError"
        :result="selectedResult"
        :campaigns="campaigns"
        @close="isModalOpen = false; mutationError = null"
        @save="handleSave"
        @delete="handleDelete"
      />
    </template>
  </div>
</template>
