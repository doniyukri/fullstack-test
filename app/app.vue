<script setup lang="ts">
useHead({
  title: 'eci.id',
  htmlAttrs: { lang: 'id' },
  link: [{ rel: 'icon', type: 'image/webp', href: '/eci-logo.webp' }],
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtPage />
    <AppToast />
  </div>
</template>
