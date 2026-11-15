<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'

defineProps<{
  title?: string
  backTo?: string
}>()
</script>

<template>
  <header class="site-header">
    <div class="header-content">
      <NuxtLink
        v-if="backTo"
        :to="backTo"
        class="back-link"
        aria-label="Kembali"
      >
        <ArrowLeft :size="24" aria-hidden="true" />
      </NuxtLink>

      <h1 v-if="title">{{ title }}</h1>
      <span v-else class="brand">Electronic City</span>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  background: white;
  border-bottom: 1px solid #d6dee8;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 70rem;
  margin-inline: auto;
  padding: 1rem;
}

h1 {
  margin: 0;
  font-size: 1.5rem;
}

.brand {
  color: var(--primary);
  font-size: 1.25rem;
  font-weight: 700;
}

.back-link {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.5rem;
  color: var(--primary);
}

.back-link:hover {
  background: #eaf4fc;
}
</style>