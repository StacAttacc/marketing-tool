<script setup lang="ts">
import { useFilteredListSpends } from '~/queries/spend/useFilteredListSpends'
import { useListCampaigns } from '~/queries/campaign/useListCampaigns'
import { useCreateSpend } from '~/queries/spend/useCreateSpend'
import { useUpdateSpend } from '~/queries/spend/useUpdateSpend'
import { useDeleteSpend } from '~/queries/spend/useDeleteSpend'
import { formatCurrency } from '~/utils/formatCurrency'

const isModalOpen = ref(false)
const modalMode = ref<'create' | 'view' | 'edit'>('create')

const campaignsQuery = useListCampaigns()
const campaigns = computed(() => campaignsQuery.data.value?.campaigns ?? [])

const createSpend = useCreateSpend()
const updateSpend = useUpdateSpend()
const deleteSpend = useDeleteSpend()

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
} = useFilteredListSpends()

type SpendRow = NonNullable<typeof data.value>['spends'][number]
const selectedSpend = ref<SpendRow | null>(null)

function openCreateModal() {
  modalMode.value = 'create'
  selectedSpend.value = null
  isModalOpen.value = true
}

function openViewModal(spend: SpendRow) {
  modalMode.value = 'view'
  selectedSpend.value = spend
  isModalOpen.value = true
}

function handleSave(data: { campaignId: string, amountCents: number, date: string, id?: string }) {
  mutationError.value = null
  const callbacks = {
    onSuccess: () => { isModalOpen.value = false },
    onError: (err: Error) => { mutationError.value = err.message },
  }
  if (modalMode.value === 'create') {
    createSpend.mutate({ campaignId: data.campaignId, amountCents: data.amountCents, date: data.date }, callbacks)
  }
  else {
    updateSpend.mutate({ id: data.id!, campaignId: data.campaignId, amountCents: data.amountCents, date: data.date }, callbacks)
  }
}

function handleDelete(spendId: string) {
  deleteSpend.mutate(spendId, {
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
        title="Manage your spending"
        button-text="+ New Spend Entry"
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
        <EsScrollFade>
          <table class="table table-sm w-full text-center whitespace-nowrap">
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
                    @click="toggleSort('amountCents')"
                  >
                    <Icon name="lucide:dollar-sign" />
                    Amount
                    <Icon
                      :name="sortBy === 'amountCents' ? (sortOrder === 'asc' ? 'lucide:chevron-up' : 'lucide:chevron-down') : 'lucide:chevrons-up-down'"
                      :class="sortBy === 'amountCents' ? 'opacity-100' : 'opacity-40'"
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
                v-for="spend in data?.spends"
                :key="spend.id"
                class="border-b border-base-300/50 hover:bg-base-300/30 transition-colors"
              >
                <td>{{ spend.channelName }}</td>
                <td>{{ new Date(spend.date).toLocaleDateString() }}</td>
                <td>{{ formatCurrency(spend.amountCents) }}</td>
                <td>
                  <button
                    class="btn btn-sm border rounded-lg bg-transparent border-base-300 hover:bg-base-200"
                    @click="openViewModal(spend)"
                  >
                    <Icon name="lucide:eye" />
                  </button>
                </td>
              </tr>
              <tr v-if="!data?.spends?.length">
                <td
                  colspan="4"
                  class="text-center py-8 text-base-content/50"
                >
                  No spend entries found.
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

      <EsInputsSpendModal
        :is-open="isModalOpen"
        :mode="modalMode"
        :error="mutationError"
        :spend="selectedSpend"
        :campaigns="campaigns"
        @close="isModalOpen = false; mutationError = null"
        @save="handleSave"
        @delete="handleDelete"
      />
    </template>
  </div>
</template>
