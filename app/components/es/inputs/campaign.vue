<script setup lang="ts">
import { useFilteredListCampaigns } from '~/queries/campaign/useFilteredListCampaigns'
import { useListBudgets } from '~/queries/budget/useListBudgets'
import { useListChannels } from '~/queries/channel/useListChannels'
import { useListChannelBudgets } from '~/queries/channel_budget/useListChannelBudgets'
import { useCreateCampaign } from '~/queries/campaign/useCreateCampaign'
import { useUpdateCampaign } from '~/queries/campaign/useUpdateCampaign'
import { useDeleteCampaign } from '~/queries/campaign/useDeleteCampaign'
import { formatCurrency } from '~/utils/formatCurrency'

const budgetsQuery = useListBudgets()
const channelsQuery = useListChannels()
const channelBudgetsQuery = useListChannelBudgets()

const budgets = computed(() => budgetsQuery.data.value?.budgets ?? [])
const channels = computed(() => channelsQuery.data.value?.channels ?? [])
const channelBudgets = computed(() => channelBudgetsQuery.data.value?.channelBudgets ?? [])

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
} = useFilteredListCampaigns()

const campaigns = computed(() => data.value?.campaigns ?? [])

const createCampaign = useCreateCampaign()
const updateCampaign = useUpdateCampaign()
const deleteCampaign = useDeleteCampaign()

const isModalOpen = ref(false)
const modalMode = ref<'create' | 'view' | 'edit'>('create')
const selectedCampaign = ref<(typeof campaigns.value)[number] | null>(null)
const mutationError = ref<string | null>(null)

function openCreateModal() {
  modalMode.value = 'create'
  selectedCampaign.value = null
  isModalOpen.value = true
}

function openViewModal(campaign: (typeof campaigns.value)[number]) {
  modalMode.value = 'view'
  selectedCampaign.value = campaign
  isModalOpen.value = true
}

function handleSave(data: { channelBudgetId: string, amountCents: number, startDate: string, endDate: string, id?: string }) {
  mutationError.value = null
  const callbacks = {
    onSuccess: () => { isModalOpen.value = false },
    onError: (err: Error) => { mutationError.value = err.message },
  }
  if (modalMode.value === 'create') {
    createCampaign.mutate({ channelBudgetId: data.channelBudgetId, amountCents: data.amountCents, startDate: data.startDate, endDate: data.endDate }, callbacks)
  }
  else {
    updateCampaign.mutate({ id: data.id!, channelBudgetId: data.channelBudgetId, amountCents: data.amountCents, startDate: data.startDate, endDate: data.endDate }, callbacks)
  }
}

function handleDelete(campaignId: string) {
  deleteCampaign.mutate(campaignId, {
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
      v-if="isLoading"
      class="flex justify-center py-8"
    >
      <span class="loading loading-spinner loading-lg text-prometheus-orange" />
    </div>

    <template v-else>
      <EsInputsCommonHeader
        title="Manage your campaigns"
        button-text="+ New Campaign"
        @add="openCreateModal"
      />
      <div class="rounded-xl bg-base-100 shadow shadow-base-300 overflow-hidden">
        <EsInputsCommonSearchBar
          v-model:field="searchField"
          v-model:value="search"
          :fields="[
            { value: 'budgetPeriod', label: 'Budget Period', type: 'text' },
            { value: 'channel', label: 'Channel', type: 'text' },
            { value: 'startDate', label: 'Date', type: 'date' },
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
                  <div class="flex items-center justify-center gap-1">
                    <Icon name="lucide:calendar-range" />
                    Budget Period
                  </div>
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
                v-for="campaign in campaigns"
                :key="campaign.id"
                class="border-b border-base-300/50 hover:bg-base-300/30 transition-colors"
              >
                <td>{{ campaign.channelName }}</td>
                <td>{{ campaign.budgetPeriod }}</td>
                <td>{{ campaign.startDate }} – {{ campaign.endDate }}</td>
                <td>{{ formatCurrency(campaign.amountCents) }}</td>
                <td>
                  <button
                    class="btn btn-sm border rounded-lg bg-transparent border-base-300 hover:bg-base-200"
                    @click="openViewModal(campaign)"
                  >
                    <Icon name="lucide:eye" />
                  </button>
                </td>
              </tr>
              <tr v-if="campaigns.length === 0">
                <td
                  colspan="5"
                  class="text-center py-8 text-base-content/50"
                >
                  No campaigns found.
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

      <EsInputsCampaignModal
        :is-open="isModalOpen"
        :mode="modalMode"
        :error="mutationError"
        :campaign="selectedCampaign"
        :budgets="budgets"
        :channels="channels"
        :channel-budgets="channelBudgets"
        @close="isModalOpen = false; mutationError = null"
        @save="handleSave"
        @delete="handleDelete"
      />
    </template>
  </div>
</template>
