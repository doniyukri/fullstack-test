<script setup lang="ts">
import { ChevronDown, SlidersHorizontal } from '@lucide/vue'
import type { EmployeeListItem } from '#shared/employee-view'
const search = ref('')
const appliedSearch = ref('')
const filters = ref<Record<string, string>>({})
const filterOpen = ref(false)
const selectedId = ref<string | null>(null)
const filterCount = computed(() => Object.keys(filters.value).length)
const list = useCursorList<EmployeeListItem>((cursor, signal) =>
  $fetch<{ items: EmployeeListItem[]; nextCursor: string | null }>('/api/employees', {
    query: { ...filters.value, search: appliedSearch.value || undefined, cursor },
    signal,
    retry: 0,
  }),
)
const { items, loading, loaded, hasMore, error } = list
let searchTimer: ReturnType<typeof setTimeout> | undefined

watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    appliedSearch.value = search.value.trim()
    void list.reset()
  }, 300)
})

function applyFilters(value: Record<string, string>) {
  filters.value = value
  filterOpen.value = false
  void list.reset()
}

onMounted(() => {
  void list.reset()
})
onBeforeUnmount(() => clearTimeout(searchTimer))
</script>

<template>
  <div>
    <AppHeader title="Form Karyawan" back-to="/home" />
    <main class="page employee-page">
      <details class="panel employee-panel" open>
        <summary><span>Input Karyawan</span><ChevronDown :size="22" aria-hidden="true" /></summary>
        <EmployeeForm @saved="list.reset()" />
      </details>
      <section aria-labelledby="employees-title">
        <h2 id="employees-title">Data Karyawan</h2>
        <div class="search-row">
          <label class="sr-only" for="employee-search">Cari nama atau jabatan</label>
          <input
            id="employee-search"
            v-model="search"
            class="text-input"
            type="search"
            maxlength="80"
            placeholder="Cari nama atau jabatan"
          />
          <button
            class="icon-button filter-button"
            type="button"
            :aria-label="
              filterCount ? `Filter karyawan, ${filterCount} filter aktif` : 'Filter karyawan'
            "
            @click="filterOpen = true"
          >
            <SlidersHorizontal :size="23" aria-hidden="true" /><span
              v-if="filterCount"
              class="filter-count"
              aria-hidden="true"
              >{{ filterCount }}</span
            >
          </button>
        </div>
        <p v-if="loaded && items.length === 0">Tidak ada karyawan yang sesuai</p>
        <div class="record-list">
          <RecordCard
            v-for="employee in items"
            :key="employee.id"
            :title="employee.name"
            :description="`${employee.position} · ${employee.cityName}`"
            :badge="`Gol. ${employee.gradeId}`"
            @select="selectedId = employee.id"
          />
        </div>
        <ListLoader :loading="loading" :has-more="hasMore" :error="error" @load="list.loadMore" />
      </section>
    </main>
    <EmployeeFilters
      v-if="filterOpen"
      :value="filters"
      @close="filterOpen = false"
      @apply="applyFilters"
    />
    <EmployeeDetails v-if="selectedId" :id="selectedId" @close="selectedId = null" />
  </div>
</template>

<style scoped>
.employee-page {
  display: grid;
  gap: 2rem;
  max-width: 58rem;
}
.employee-panel summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  cursor: pointer;
  font-weight: 700;
  font-size: 1.2rem;
  list-style: none;
}
.employee-panel summary::-webkit-details-marker {
  display: none;
}
.employee-panel[open] summary {
  margin-bottom: 1.5rem;
}
.employee-panel:not([open]) summary svg {
  transform: rotate(-90deg);
}
.search-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1.25rem 0;
}
.filter-button {
  position: relative;
  flex-shrink: 0;
}
.filter-count {
  position: absolute;
  top: -0.15rem;
  right: -0.15rem;
  display: grid;
  place-items: center;
  width: 1.25rem;
  height: 1.25rem;
  aspect-ratio: 1;
  border-radius: 50%;
  color: white;
  background: var(--primary);
  font-size: 0.75rem;
}
</style>
