<script setup lang="ts">
import { terbilangInputSchema } from '#shared/calculator-inputs'

const ready = ref(false)
onMounted(() => {
  ready.value = true
})

const { data, error, refresh } = await useFetch('/api/terbilang', {
  retry: 0,
})

if (error.value) {
  throw createError({
    statusCode: 503,
    statusMessage: 'Tidak dapat memuat data Terbilang. Coba lagi.',
  })
}

const record = data.value?.record

const amount = ref(record?.amount ?? '')
const savedAmount = ref(record?.amount ?? '')
const version = ref(record?.version ?? 0)

const saving = ref(false)
const errorMessage = ref('')
const confirmOpen = ref(false)

let destination = '/home'
let allowLeave = false

const hasChanges = computed(() => amount.value !== savedAmount.value)

async function saveInput(action: 'submit' | 'save'): Promise<boolean> {
  if (saving.value) {
    return false
  }

  errorMessage.value = ''

  const parsed = terbilangInputSchema.safeParse({
    amount: amount.value,
  })

  if (!parsed.success) {
    errorMessage.value = 'Masukkan bilangan bulat 0–999,999,999,999,999.'
    return false
  }

  const input = parsed.data

  saving.value = true

  try {
    const result = await $fetch('/api/terbilang', {
      method: 'POST',
      retry: 0,
      body: {
        ...input,
        action,
        version: version.value,
      },

      onResponseError({ response }) {
        errorMessage.value =
          response._data?.statusMessage || 'Tidak dapat menyimpan data. Coba lagi.'
      },
    })

    // Keep the saved input and version if loading output fails
    version.value = result.version
    savedAmount.value = input.amount

    await refresh()

    if (error.value) {
      errorMessage.value = 'Data tersimpan, tetapi output belum dapat dimuat. Muat ulang halaman.'
      return false
    }

    return true
  } catch {
    if (!errorMessage.value) {
      errorMessage.value = 'Tidak dapat terhubung. Coba lagi.'
    }

    return false
  } finally {
    saving.value = false
  }
}

async function submitTerbilang() {
  await saveInput('submit')
}

async function saveAndLeave() {
  const saved = await saveInput('save')

  if (!saved) {
    return
  }

  allowLeave = true
  confirmOpen.value = false
  await navigateTo(destination)
}

async function discardAndLeave() {
  allowLeave = true
  confirmOpen.value = false
  await navigateTo(destination)
}

onBeforeRouteLeave((to) => {
  if (saving.value) {
    return false
  }

  if (!hasChanges.value || allowLeave) {
    return
  }

  destination = to.fullPath
  errorMessage.value = ''
  confirmOpen.value = true

  return false
})
</script>

<template>
  <div>
    <AppHeader title="Terbilang" back-to="/home" />

    <main class="page terbilang-page">
      <form class="panel" @submit.prevent="submitTerbilang">
        <fieldset class="amount-fields" :disabled="saving || !ready">
          <div class="submit-row">
            <div class="form-field">
              <label for="amount">Nominal (Rp)</label>

              <NumberInput
                id="amount"
                v-model="amount"
                name="amount"
                autocomplete="off"
                aria-describedby="amount-help"
                required
              />
            </div>

            <button class="primary-button" type="submit">
              {{ saving ? 'Memproses…' : 'Submit' }}
            </button>
          </div>

          <p id="amount-help" class="field-help">Maksimal 15 digit.</p>
        </fieldset>
      </form>

      <p v-if="errorMessage && !confirmOpen" class="form-error" role="alert">
        {{ errorMessage }}
      </p>

      <section class="panel" aria-labelledby="terbilang-title">
        <h2 id="terbilang-title">Terbilang</h2>

        <p v-if="data?.record" class="terbilang-output" aria-live="polite">
          "{{ data.record.text }}"
        </p>

        <p v-else>Belum ada output.</p>
      </section>

      <div class="page-actions">
        <button
          class="primary-button"
          type="button"
          :disabled="saving || !ready"
          @click="navigateTo('/home')"
        >
          Save &amp; kembali
        </button>
      </div>
    </main>

    <AppDialog
      v-if="confirmOpen"
      title="Simpan perubahan?"
      :busy="saving"
      @close="confirmOpen = false"
    >
      <p>Input saat ini belum disimpan.</p>

      <p v-if="errorMessage" class="form-error" role="alert">
        {{ errorMessage }}
      </p>

      <template #actions>
        <button
          class="secondary-button dialog-action"
          type="button"
          :disabled="saving || !ready"
          @click="discardAndLeave"
        >
          Buang
        </button>

        <button
          class="primary-button dialog-action"
          type="button"
          :disabled="saving || !ready"
          @click="saveAndLeave"
        >
          {{ saving ? 'Menyimpan…' : 'Simpan' }}
        </button>
      </template>
    </AppDialog>
  </div>
</template>

<style scoped>
.terbilang-page {
  display: grid;
  gap: 1.5rem;
  max-width: 48rem;
}

.amount-fields {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.terbilang-output {
  margin-bottom: 0;
  color: var(--primary);
  font-size: clamp(1.125rem, 2vw, 1.375rem);
  font-weight: 500;
  line-height: 1.8;
  overflow-wrap: anywhere;
}
</style>
