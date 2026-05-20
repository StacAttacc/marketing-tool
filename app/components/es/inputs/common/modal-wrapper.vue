<script setup lang="ts">
defineProps<{
  isOpen: boolean
  title: string
  mode: 'create' | 'view' | 'edit' | 'prediction'
  isFormValid?: boolean
  error?: string | null
}>()

const emit = defineEmits<(e: 'close' | 'save' | 'delete' | 'edit') => void>()

const confirmDelete = ref(false)

function handleClose() {
  confirmDelete.value = false
  emit('close')
}
</script>

<template>
  <dialog
    :class="['modal', { 'modal-open': isOpen }]"
    @keydown.escape="handleClose"
  >
    <div class="modal-box max-w-lg max-h-[90%] rounded-lg text-sm flex flex-col shadow-sm shadow-base-300">
      <div class="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-base-300 shrink-0">
        <h3 class="font-bold text-lg min-w-0 mr-2 truncate">
          {{ title }}
        </h3>
        <div class="flex gap-2 shrink-0">
          <template v-if="mode === 'create'">
            <button
              class="btn btn-ghost btn-sm border border-base-200 bg-base-100 shadow shadow-base-300 rounded-lg"
              @click="emit('close')"
            >
              Cancel
            </button>
            <button
              class="btn btn-ghost btn-sm border border-base-200 bg-base-100 shadow shadow-base-300 rounded-lg"
              :disabled="!isFormValid"
              @click="emit('save')"
            >
              Create
            </button>
          </template>

          <template v-else-if="mode === 'view'">
            <button
              :class="['btn btn-sm border shadow shadow-base-300 rounded-lg', confirmDelete ? 'btn-error' : 'btn-ghost border-base-200 bg-base-100']"
              @click="confirmDelete ? emit('delete') : (confirmDelete = true)"
            >
              {{ confirmDelete ? 'Confirm?' : 'Delete' }}
            </button>
            <button
              class="btn btn-ghost btn-sm border border-base-200 bg-base-100 shadow shadow-base-300 rounded-lg"
              @click="handleClose"
            >
              Close
            </button>
            <button
              class="btn btn-ghost btn-sm border border-base-200 bg-base-100 shadow shadow-base-300 rounded-lg"
              @click="emit('edit')"
            >
              Edit
            </button>
          </template>

          <template v-else-if="mode === 'edit'">
            <button
              class="btn btn-ghost btn-sm border border-base-200 bg-base-100 shadow shadow-base-300 rounded-lg"
              @click="emit('close')"
            >
              Cancel
            </button>
            <button
              class="btn btn-ghost btn-sm border border-base-200 bg-base-100 shadow shadow-base-300 rounded-lg"
              :disabled="!isFormValid"
              @click="emit('save')"
            >
              Save Changes
            </button>
          </template>

          <template v-else-if="mode === 'prediction'">
            <button
              class="btn btn-ghost btn-sm border border-base-200 bg-base-100 shadow shadow-base-300 rounded-lg"
              @click="emit('delete')"
            >
              Delete
            </button>
            <button
              class="btn btn-ghost btn-sm border border-base-200 bg-base-100 shadow shadow-base-300 rounded-lg"
              @click="emit('close')"
            >
              Close
            </button>
          </template>
        </div>
      </div>

      <div class="space-y-4 py-4 overflow-y-auto flex-1">
        <div
          v-if="error"
          class="alert alert-error text-sm"
        >
          <span>{{ error }}</span>
        </div>
        <slot />
      </div>
    </div>

    <form
      method="dialog"
      class="modal-backdrop"
    >
      <button @click="handleClose">
        close
      </button>
    </form>
  </dialog>
</template>
