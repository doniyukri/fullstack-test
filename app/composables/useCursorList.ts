interface CursorPage<T> {
  items: T[]
  nextCursor: string | null
}

export function useCursorList<T>(
  fetchPage: (cursor: string | undefined, signal: AbortSignal) => Promise<CursorPage<T>>,
) {
  const items = shallowRef<T[]>([])
  const cursor = ref<string>()
  const hasMore = ref(true)
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref('')
  let controller: AbortController | undefined
  let generation = 0

  async function loadMore() {
    if (loading.value || !hasMore.value) return
    const current = generation
    loading.value = true
    error.value = ''
    controller = new AbortController()
    try {
      const page = await fetchPage(cursor.value, controller.signal)
      // Ignore an old response if the search or filters changed while it was loading
      if (current !== generation) return
      items.value = [...items.value, ...page.items]
      cursor.value = page.nextCursor ?? undefined
      hasMore.value = page.nextCursor !== null
      loaded.value = true
    } catch (failure) {
      if (current === generation && !controller.signal.aborted) {
        error.value = 'Data belum dapat dimuat. Coba lagi'
      }
    } finally {
      if (current === generation) loading.value = false
    }
  }

  function reset() {
    // Stop the previous request and start again from the first page
    generation += 1
    controller?.abort()
    items.value = []
    cursor.value = undefined
    hasMore.value = true
    loaded.value = false
    loading.value = false
    error.value = ''
    return loadMore()
  }

  onBeforeUnmount(() => {
    generation += 1
    controller?.abort()
  })
  return { items, hasMore, loading, loaded, error, loadMore, reset }
}
