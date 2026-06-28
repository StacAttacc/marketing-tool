<script setup lang="ts">
const model = defineModel<{ start: Date, end: Date }>({
  default: () => ({
    start: new Date(),
    end: new Date(),
  }),
})

const dropdownRef = ref<HTMLDetailsElement | null>(null)
const isOpen = ref(false)
const positionClasses = ref('')

const updatePosition = () => {
  if (!dropdownRef.value) return

  const rect = dropdownRef.value.getBoundingClientRect()
  const spaceRight = window.innerWidth - rect.left

  const classes: string[] = []

  if (spaceRight < 500) {
    classes.push('dropdown-end')
  }

  positionClasses.value = classes.join(' ')
}

const onToggle = (e: Event) => {
  isOpen.value = (e.target as HTMLDetailsElement).open
  updatePosition()
}

const handleClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value?.open && !dropdownRef.value.contains(e.target as Node)) {
    dropdownRef.value.open = false
    isOpen.value = false
  }
}

onMounted(() => {
  updatePosition()
  window.addEventListener('resize', updatePosition)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('resize', updatePosition)
  document.removeEventListener('click', handleClickOutside)
})

const displayRange = computed(() => {
  const start = model.value.start.toLocaleDateString()
  const end = model.value.end.toLocaleDateString()
  return `${start} - ${end}`
})

type PresetKey = 'last7days' | 'thisMonth' | 'lastMonth' | 'last3Months' | 'thisYear' | 'lastYear' | 'allTime'

const presets: { key: PresetKey, label: string, getRange: () => { start: Date, end: Date } }[] = [
  {
    key: 'last7days',
    label: 'Last 7 Days',
    getRange: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(end.getDate() - 7)
      return { start, end }
    },
  },
  {
    key: 'thisMonth',
    label: 'This Month',
    getRange: () => {
      const now = new Date()
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now }
    },
  },
  {
    key: 'lastMonth',
    label: 'Last Month',
    getRange: () => {
      const now = new Date()
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 0),
      }
    },
  },
  {
    key: 'last3Months',
    label: 'Last 3 Months',
    getRange: () => {
      const now = new Date()
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 3, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 0),
      }
    },
  },
  {
    key: 'thisYear',
    label: 'This Year',
    getRange: () => {
      const now = new Date()
      return { start: new Date(now.getFullYear(), 0, 1), end: now }
    },
  },
  {
    key: 'lastYear',
    label: 'Last Year',
    getRange: () => {
      const now = new Date()
      return {
        start: new Date(now.getFullYear() - 1, 0, 1),
        end: new Date(now.getFullYear() - 1, 11, 31),
      }
    },
  },
  {
    key: 'allTime',
    label: 'All Time',
    getRange: () => ({ start: new Date(2025, 11, 1), end: new Date() }),
  },
]

const maxDate = new Date()

const selectPreset = (preset: typeof presets[number]) => {
  model.value = preset.getRange()
}
</script>

<template>
  <details
    ref="dropdownRef"
    class="dropdown"
    :class="positionClasses"
    @toggle="onToggle"
  >
    <summary
      class="btn btn-sm border border-transparent rounded-lg"
      :class="isOpen ? 'bg-base-300' : 'bg-base-100 border-base-300 hover:bg-base-200'"
    >
      <Icon name="lucide:calendar" />
      {{ displayRange }}
      <Icon
        v-if="isOpen"
        name="lucide:chevron-up"
      />
      <Icon
        v-else
        name="lucide:chevron-down"
      />
    </summary>
    <div class="dropdown-content z-50 mt-2 rounded-xl bg-base-100 shadow shadow-prometheus-orange/50 p-1 max-w-[95vw]">
      <div class="flex flex-row rounded-xl p-4 min-w-max">
        <div>
          <ul class="menu w-full grow">
            <li
              v-for="preset in presets"
              :key="preset.key"
              class="w-full"
            >
              <button
                class="hover:bg-base-200 w-full text-left rounded-xl text-sm whitespace-nowrap"
                @click="selectPreset(preset)"
              >
                {{ preset.label }}
              </button>
            </li>
          </ul>
        </div>
        <ClientOnly>
          <VDatePicker
            v-model.range="model"
            mode="date"
            transparent
            borderless
            color="orange"
            :max-date="maxDate"
          />
        </ClientOnly>
      </div>
    </div>
  </details>
</template>
