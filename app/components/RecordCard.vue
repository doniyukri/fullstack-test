<script setup lang="ts">
defineProps<{ title: string; description: string; date?: string; badge?: string }>()
const emit = defineEmits<{ select: [] }>()
</script>

<template>
  <button class="record-card" type="button" @click="emit('select')">
    <span class="record-copy">
      <strong>{{ title }}</strong>
      <span>{{ description }}</span>
      <time v-if="date" :datetime="date">{{ formatDate(date) }}</time>
    </span>
    <span v-if="badge" class="badge">{{ badge }}</span>
  </button>
</template>

<style scoped>
.record-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  padding: 1.25rem;
  text-align: left;
  color: inherit;
  background: white;
  border: 1px solid #d6dee8;
  border-radius: 0.75rem;
  cursor: pointer;
}
.record-card:hover {
  background: #f0f7fc;
  border-color: var(--primary);
}
.record-copy {
  display: grid;
  gap: 0.4rem;
  min-width: 0;
  overflow-wrap: anywhere;
}
strong {
  font-size: 1.05rem;
}
.record-copy > span,
time {
  color: #526579;
  font-size: 0.9rem;
}
.badge {
  flex-shrink: 0;
  padding: 0.35rem 0.55rem;
  border-radius: 0.3rem;
  color: #07548e;
  background: #e8f2ff;
  font-size: 0.8rem;
}
</style>
