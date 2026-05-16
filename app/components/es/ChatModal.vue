<script setup lang="ts">
import { useListBudgets } from '~/queries/budget/useListBudgets'
import { useChat } from '~/queries/llm/useChat'

defineProps<{
  isOpen: boolean
}>()

const { data: budgetsData } = useListBudgets()

const emit = defineEmits<{
  close: []
}>()

type Message = {
  id: number
  role: 'user' | 'assistant'
  text?: string
  images?: string[]
  budgetPeriod?: string
}

type PendingImage = {
  data: string
  mimeType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
}

const pendingImages = ref<PendingImage[]>([])

const fileInput = ref<HTMLInputElement | null>(null)

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  if (!target.files) return
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  for (const file of target.files) {
    if (!validTypes.includes(file.type)) continue
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      pendingImages.value.push({
        data: dataUrl.split(',')[1],
        mimeType: file.type as PendingImage['mimeType'],
      })
    }
    reader.readAsDataURL(file)
  }
  target.value = ''
}

const messages = ref<Message[]>([])
const input = ref('')
const nextId = ref(1)
const { mutateAsync: sendChat, isPending: isLoading } = useChat()
const messagesContainer = ref<HTMLDivElement | null>(null)

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

async function sendMessage() {
  const text = input.value.trim()
  const hasBudget = selectedBudgetId.value !== null
  const hasImages = pendingImages.value.length > 0
  if (!text && !hasBudget && !hasImages) return

  const imagesToSend = [...pendingImages.value]
  const budgetIdToSend = selectedBudgetId.value

  messages.value.push({
    id: nextId.value++,
    role: 'user',
    text: text || undefined,
    images: imagesToSend.map(img => `data:${img.mimeType};base64,${img.data}`),
    budgetPeriod: selectedBudget.value?.budgetPeriod,
  })
  input.value = ''
  pendingImages.value = []

  try {
    const response = await sendChat({
      text: text || undefined,
      budgetId: budgetIdToSend ?? undefined,
      images: imagesToSend.length ? imagesToSend : undefined,
    })
    messages.value.push({ id: nextId.value++, role: 'assistant', text: response.text })
    scrollToBottom()
  }
  catch {
    messages.value.push({ id: nextId.value++, role: 'assistant', text: 'Something went wrong, please try again.' })
    scrollToBottom()
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

const dropdownRef = ref<HTMLDetailsElement | null>(null)

const handleClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value?.open && !dropdownRef.value.contains(e.target as Node)) {
    dropdownRef.value.open = false
  }
}

const selectedBudgetId = ref<string | null>(null)

const selectBudget = (id?: string | null) => {
  if (id) selectedBudgetId.value = id
  else {
    selectedBudgetId.value = null
  }
  if (dropdownRef.value) {
    dropdownRef.value.open = false
  }
}

const selectedBudget = computed(() =>
  budgetsData.value?.budgets.find(b => b.id === selectedBudgetId.value),
)
onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<template>
  <dialog
    :class="['modal', { 'modal-open': isOpen }]"
    @keydown.escape="emit('close')"
  >
    <div class="modal-box max-w-lg h-[66%] rounded-lg text-sm flex flex-col shadow-sm shadow-base-300">
      <div class="flex items-center justify-between pb-4 border-b border-base-300 shrink-0">
        <h3 class="font-bold text-lg">
          Enjoy chatting
        </h3>
        <button
          class="btn btn-ghost btn-sm border border-base-200 bg-base-100 shadow shadow-base-300 rounded-lg"
          @click="emit('close')"
        >
          Close
        </button>
      </div>

      <div
        ref="messagesContainer"
        class="flex-1 scrollbar-hidden overflow-y-scroll py-4 px-1 space-y-3"
      >
        <p
          v-if="messages.length === 0"
          class="text-center text-base-content/40"
        >
          Ask me anything...
        </p>
        <div
          v-for="message in messages"
          :key="message.id"
          :class="['flex', message.role === 'user' ? 'justify-end' : 'justify-start']"
        >
          <div
            :class="[
              'max-w-[75%] rounded-lg px-3 py-2 shadow-xs shadow-base-300',
              message.role === 'user'
                ? 'bg-base-200/50'
                : 'bg-base-100/50',
            ]"
          >
            <div
              v-if="message.images?.length"
              class="flex flex-wrap gap-1 mb-1"
            >
              <img
                v-for="(src, i) in message.images"
                :key="i"
                :src="src"
                class="max-h-24 rounded object-cover"
              >
            </div>
            <span
              v-if="message.budgetPeriod"
              class="badge badge-sm badge-outline block mb-1"
            >{{ message.budgetPeriod }}</span>
            {{ message.text }}
          </div>
        </div>

        <div
          v-if="isLoading"
          class="flex justify-start"
        >
          <div class="max-w-[75%] rounded-lg px-3 py-2 bg-base-100/50 shadow-xs shadow-base-300">
            <span class="loading loading-dots loading-xs" />
          </div>
        </div>
      </div>

      <div class="pb-4 mb-0 border-t border-base-300 shrink-0">
        <div
          v-if="pendingImages.length"
          class="flex gap-1 overflow-x-auto px-2 py-1"
        >
          <img
            v-for="(img, i) in pendingImages"
            :key="i"
            :src="`data:${img.mimeType};base64,${img.data}`"
            class="h-12 rounded object-cover shrink-0"
          >
        </div>
        <div class="flex items-center p-0 m-2 mb-0 rounded-lg border-2 border-base-300/50">
          <button
            class="flex items-center gap-1 h-8 px-3 text-sm bg-base-200/50 rounded-l-lg rounded-r-none cursor-pointer hover:bg-base-200"
            @click="fileInput?.click()"
          >
            <Icon name="lucide:upload" />
          </button>
          <details
            ref="dropdownRef"
            class="dropdown dropdown-top"
          >
            <summary
              class="btn btn-sm flex items-center gap-1 items-center h-8 px-3 text-sm bg-base-200/50 rounded-none cursor-pointer hover:bg-base-200"
            >
              <span v-if="selectedBudget"> {{ selectedBudget?.budgetPeriod }} </span>
              <Icon
                v-else
                name="lucide:calendar"
              />
            </summary>
            <div class="dropdown-content z-999 mt-2 rounded-xl bg-base-100 shadow shadow-prometheus-orange/50 p-1">
              <ul class="menu w-full">
                <li>
                  <button
                    class="hover:bg-base-200 w-full text-left rounded-xl text-sm whitespace-nowrap"
                    :class="{ 'bg-base-200': selectedBudgetId === null }"
                    @click="selectBudget()"
                  >
                    None
                  </button>
                </li>
                <li
                  v-for="b in budgetsData?.budgets"
                  :key="b.id"
                >
                  <button
                    class="hover:bg-base-200 w-full text-left rounded-xl text-sm whitespace-nowrap"
                    :class="{ 'bg-base-200': b.id === selectedBudgetId }"
                    @click="selectBudget(b.id)"
                  >
                    {{ b.budgetPeriod }}
                  </button>
                </li>
              </ul>
            </div>
          </details>

          <input
            id="fileUploadId"
            ref="fileInput"
            type="file"
            accept="image/*"
            multiple
            name="fileUploadId"
            style="display:none"
            @change="onFileChange"
          >
          <input
            v-model="input"
            type="text"
            class="input input-sm flex-1 bg-base-100 rounded-none"
            placeholder="Type a message"
            @keydown="onKeydown"
          >
          <button
            class="flex items-center gap-1 h-8 px-3 text-sm bg-base-200/50 rounded-r-lg rounded-l-none cursor-pointer hover:bg-base-200"
            :disabled="(!input.trim() && !selectedBudgetId && !pendingImages.length) || isLoading"
            @click="sendMessage"
          >
            Send
          </button>
        </div>
      </div>
    </div>

    <form
      method="dialog"
      class="modal-backdrop"
    >
      <button @click="emit('close')">
        close
      </button>
    </form>
  </dialog>
</template>
