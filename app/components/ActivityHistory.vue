<script setup lang="ts">
import type { Activity } from '#shared/activity'
type HistoryItem = Omit<Activity, 'userId'>
const history = useCursorList<HistoryItem>((cursor, signal) =>
  $fetch<{ items: HistoryItem[]; nextCursor: string | null }>('/api/history', {
    query: { cursor },
    signal,
    retry: 0,
  }),
)
const { items, hasMore, loading, loaded, error } = history
const selected = ref<HistoryItem | null>(null)
onMounted(() => {
  void history.reset()
})
</script>

<template>
  <section class="history-section" aria-labelledby="history-title">
    <h2 id="history-title">Log History</h2>
    <p v-if="loaded && items.length === 0">Belum ada aktivitas</p>
    <div class="record-list">
      <RecordCard
        v-for="item in items"
        :key="item.id"
        :title="item.module"
        :description="
          item.demo
            ? 'Data contoh untuk demo'
            : item.module === 'Form Karyawan'
              ? 'Karyawan baru ditambahkan'
              : 'Input diperbarui'
        "
        :date="item.createdAt"
        :badge="item.action === 'submit' ? 'Submit' : 'Save'"
        @select="selected = item"
      />
    </div>
    <ListLoader :loading="loading" :has-more="hasMore" :error="error" @load="history.loadMore" />
    <AppDialog v-if="selected" title="Detail aktivitas" @close="selected = null">
      <h3>{{ selected.module }} · {{ selected.action === 'submit' ? 'Submit' : 'Save' }}</h3>
      <dl class="detail-list">
        <dt>Pengguna</dt>
        <dd>{{ selected.username }}</dd>
        <dt>Waktu</dt>
        <dd>{{ formatDate(selected.createdAt) }}</dd>
      </dl>
      <ul class="activity-changes">
        <li v-for="change in selected.changes" :key="change.field">
          <strong>{{ change.field }}</strong>
          <span>{{ change.before ?? '—' }} → {{ change.after ?? '—' }}</span>
        </li>
      </ul>
    </AppDialog>
  </section>
</template>

<style scoped>
.history-section {
  margin-top: 2rem;
}
.activity-changes {
  padding-left: 1.25rem;
}
.activity-changes li {
  margin: 0.75rem 0;
}
.activity-changes span {
  display: block;
  overflow-wrap: anywhere;
}
</style>
