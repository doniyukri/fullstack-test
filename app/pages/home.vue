<script setup lang="ts">
const logoutOpen = ref(false)
const loggingOut = ref(false)
const logoutError = ref('')

function openLogout() {
  logoutError.value = ''
  logoutOpen.value = true
}

async function logout() {
  if (loggingOut.value) {
    return
  }

  loggingOut.value = true
  logoutError.value = ''

  try {
    await $fetch('/api/auth/logout', {
      method: 'POST',
      retry: 0,
    })
  } catch {
    logoutError.value = 'Tidak dapat keluar. Coba lagi.'
    return
  } finally {
    loggingOut.value = false
  }

  logoutOpen.value = false
  await navigateTo('/login', { replace: true })
}
</script>

<template>
  <div>
    <AppHeader show-logout @logout="openLogout" />
    <main class="page">
      <nav class="feature-nav" aria-label="Fitur">
        <NuxtLink class="feature-link" to="/star">STAR</NuxtLink>
        <NuxtLink class="feature-link" to="/terbilang">Terbilang</NuxtLink>
        <NuxtLink class="feature-link" to="/form-input">Form Input</NuxtLink>
      </nav>

      <section aria-labelledby="history-title">
        <h2 id="history-title">Log History</h2>
        <p>Belum ada aktivitas.</p>
      </section>
    </main>
    <AppDialog
      v-if="logoutOpen"
      title="Keluar dari aplikasi?"
      :busy="loggingOut"
      @close="logoutOpen = false"
    >
      <p>Anda perlu masuk kembali untuk menggunakan aplikasi.</p>

      <p v-if="logoutError" class="form-error" role="alert">
        {{ logoutError }}
      </p>

      <template #actions>
        <button
          class="secondary-button dialog-action"
          type="button"
          :disabled="loggingOut"
          @click="logout"
        >
          {{ loggingOut ? 'Keluar…' : 'Keluar' }}
        </button>

        <button
          class="primary-button dialog-action"
          type="button"
          :disabled="loggingOut"
          autofocus
          @click="logoutOpen = false"
        >
          Batal
        </button>
      </template>
    </AppDialog>
  </div>
</template>
