<script setup lang="ts">
import { X } from '@lucide/vue'

const props = defineProps<{
  title: string
  busy?: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const dialog = ref<HTMLDialogElement | null>(null)
const titleId = useId()

function requestClose() {
  if (!props.busy) {
    emit('close')
  }
}

onMounted(() => {
  dialog.value?.showModal()
})

onBeforeUnmount(() => {
  dialog.value?.close()
})
</script>

<template>
  <dialog
    ref="dialog"
    class="app-dialog"
    :aria-labelledby="titleId"
    :aria-busy="busy"
    @cancel.prevent="requestClose"
  >
    <div class="dialog-header">
      <h2 :id="titleId">{{ title }}</h2>

      <button
        class="icon-button"
        type="button"
        aria-label="Tutup"
        :disabled="busy"
        @click="requestClose"
      >
        <X :size="20" aria-hidden="true" />
      </button>
    </div>

    <slot />

    <div class="dialog-actions">
      <slot name="actions" />
    </div>
  </dialog>
</template>

<style scoped>
.app-dialog {
  width: min(26rem, calc(100% - 2rem));
  max-height: calc(100dvh - 2rem);
  padding: 1.25rem;
  overflow: auto;
  border: 0;
  border-radius: 0.75rem;
  color: inherit;
  background: white;
}

.app-dialog::backdrop {
  background: rgb(15 23 42 / 45%);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

h2 {
  margin: 0;
  font-size: 1.25rem;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

:slotted(.dialog-action) {
  width: 7rem;
}
</style>