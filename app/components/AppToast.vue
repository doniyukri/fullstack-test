<script setup lang="ts">
import { X } from '@lucide/vue'
const { toast } = useToast()
let timer: ReturnType<typeof setTimeout> | undefined
watch(toast, () => {
  clearTimeout(timer)
  if (toast.value)
    timer = setTimeout(() => {
      toast.value = null
    }, 6000)
})
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="toast-region" aria-live="polite" aria-atomic="true">
    <div v-if="toast" class="toast" :class="`toast--${toast.tone}`">
      <span>{{ toast.message }}</span>
      <button
        class="icon-button"
        type="button"
        aria-label="Tutup pemberitahuan"
        @click="toast = null"
      >
        <X :size="18" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.toast-region {
  position: fixed;
  z-index: 100;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  width: min(32rem, calc(100% - 2rem));
}
.toast {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  background: #e8f2ff;
  color: #164d81;
  box-shadow: 0 6px 24px rgb(15 23 42 / 15%);
}
.toast--success {
  background: #e5f5eb;
  color: #14532d;
}
.toast--error {
  background: #ffebeb;
  color: #991b1b;
}
.toast--warning {
  background: #fff4ce;
  color: #714b00;
}
.toast .icon-button {
  flex-shrink: 0;
  color: inherit;
}
</style>
