<script setup lang="ts">
defineProps<{
  size?: 'header' | 'login'
}>()
</script>

<template>
  <img
    class="brand-logo"
    :class="{ 'brand-logo--login': size === 'login' }"
    src="/eci-logo.webp"
    alt="eci.id"
    width="1280"
    height="642"
  />
</template>

<style scoped>
.brand-logo {
  display: block;
  width: 4.5rem;
  max-width: 100%;
  height: auto;
}

.brand-logo--login {
  width: 10.5rem;
}
</style>
