<script setup lang="ts">
const props = defineProps<{ loading: boolean; hasMore: boolean; error?: string }>()
const emit = defineEmits<{ load: [] }>()
const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | undefined
onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (
        entries.some((entry) => entry.isIntersecting) &&
        !props.loading &&
        props.hasMore &&
        !props.error
      )
        emit('load')
    },
    { rootMargin: '160px' },
  )
  if (sentinel.value) observer.observe(sentinel.value)
})
watch(
  () => props.loading,
  () => {
    if (!props.loading && sentinel.value) {
      observer?.unobserve(sentinel.value)
      observer?.observe(sentinel.value)
    }
  },
)
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div ref="sentinel" class="list-loader">
    <p v-if="error" class="form-error" role="alert">{{ error }}</p>
    <p v-if="loading" role="status">Memuat data…</p>
    <button v-else-if="hasMore" class="secondary-button" type="button" @click="emit('load')">
      {{ error ? 'Coba lagi' : 'Muat berikutnya' }}
    </button>
    <p v-else>Semua data telah ditampilkan</p>
  </div>
</template>

<style scoped>
.list-loader {
  text-align: center;
  padding: 1.5rem 0;
  color: #526579;
}
</style>
