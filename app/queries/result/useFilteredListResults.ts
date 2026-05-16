import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { queryKeys } from '../queryKeys'

type SortBy = 'date' | 'revenueCents' | 'usersAcquired' | 'channel'
type SortOrder = 'asc' | 'desc'
type SearchField = 'channel' | 'date' | 'budgetPeriod'

export function useFilteredListResults() {
  const orpc = useOrpc()
  const page = ref(1)
  const pageSize = ref(9)
  const sortBy = ref<SortBy>('date')
  const sortOrder = ref<SortOrder>('desc')
  const search = ref('')
  const searchField = ref<SearchField>('channel')

  watch([search, searchField], () => {
    page.value = 1
  })

  const queryOptions = computed(() =>
    orpc.result.filter.queryOptions({
      queryKey: [...queryKeys.results, 'list', search.value, searchField.value, sortBy.value, sortOrder.value, page.value, pageSize.value],
      input: {
        search: search.value || undefined,
        searchField: searchField.value,
        sortBy: sortBy.value,
        sortDirection: sortOrder.value,
        limit: pageSize.value,
        offset: (page.value - 1) * pageSize.value,
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
      sortOrder.value = 'desc'
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
    toggleSort,
    nextPage,
    prevPage,
    totalPages,
  }
}
