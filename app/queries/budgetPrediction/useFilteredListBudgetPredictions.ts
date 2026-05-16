import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { queryKeys } from '../queryKeys'

type SortBy = 'predictionPeriod' | 'totalBudgetCents'
type SortOrder = 'asc' | 'desc'
type SearchField = 'predictionPeriod' | 'budgetPeriod'

export function useFilteredListBudgetPredictions(budgetId?: Ref<string | undefined>) {
  const orpc = useOrpc()
  const page = ref(1)
  const pageSize = ref(9)
  const sortBy = ref<SortBy>('predictionPeriod')
  const sortOrder = ref<SortOrder>('asc')
  const search = ref('')
  const searchField = ref<SearchField>('predictionPeriod')

  watch([search, searchField], () => {
    page.value = 1
  })

  const queryOptions = computed(() =>
    orpc.budgetPrediction.filter.queryOptions({
      queryKey: [
        ...queryKeys.budgetPredictions,
        'list',
        search.value,
        searchField.value,
        sortBy.value,
        sortOrder.value,
        page.value,
        pageSize.value,
        budgetId?.value,
      ],
      input: {
        search: search.value || undefined,
        searchField: searchField.value,
        sortBy: sortBy.value,
        sortDirection: sortOrder.value,
        limit: pageSize.value,
        offset: (page.value - 1) * pageSize.value,
        budgetId: budgetId?.value,
      },
      placeholderData: keepPreviousData,
    }),
  )

  const query = useQuery(queryOptions)

  const toggleSort = (column: SortBy) => {
    if (sortBy.value === column) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    }
    else {
      sortBy.value = column
      sortOrder.value = 'asc'
    }
    page.value = 1
  }

  const nextPage = () => {
    if (query.data.value?.pagination.hasMore) {
      page.value++
    }
  }

  const prevPage = () => {
    if (page.value > 1) {
      page.value--
    }
  }

  const totalPages = computed(() => {
    const total = query.data.value?.pagination.total ?? 0
    return Math.ceil(total / pageSize.value)
  })

  return {
    ...query,
    page,
    pageSize,
    sortBy,
    sortOrder,
    search,
    searchField,
    totalPages,
    toggleSort,
    nextPage,
    prevPage,
  }
}
