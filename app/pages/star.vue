<script setup lang="ts">
import type { StarType } from '#shared/star'

interface StarInput {
  count: number
  type: StarType
}

const options = [
  { value: 1, label: 'Tipe 1 (rata kiri)' },
  { value: 2, label: 'Tipe 2 (rata kanan)' },
  { value: 3, label: 'Tipe 3 (rata tengah)' },
] as const

const { data, error, refresh } = await useFetch('/api/star', {
  retry: 0,
})

if (error.value) {
  throw createError({
    statusCode: 503,
    statusMessage: 'Tidak dapat memuat data STAR. Coba lagi.',
  })
}

const record = data.value?.record

const count = ref(record ? String(record.count) : '')
const type = ref<StarType | null>(record?.type ?? null)
const version = ref(record?.version ?? 0)

const savedInput = ref<StarInput | null>(
  record ? { count: record.count, type: record.type } : null,
)

const saving = ref(false)
const errorMessage = ref('')
const confirmOpen = ref(false)

let destination = '/home'
let allowLeave = false

const hasChanges = computed(() => {
  if (!savedInput.value) {
    return count.value !== '' || type.value !== null
  }

  return (
    count.value !== String(savedInput.value.count) ||
    type.value !== savedInput.value.type
  )
})

async function saveInput(action: 'submit' | 'save'): Promise<boolean> {
  if (saving.value) {
    return false
  }

  errorMessage.value = ''

  if (!/^[1-5]$/.test(count.value) || type.value === null) {
    errorMessage.value = 'Masukkan angka 1–5 dan pilih tipe susunan.'
    return false
  }

  const input: StarInput = {
    count: Number(count.value),
    type: type.value,
  }

  saving.value = true

  try {
    const result = await $fetch('/api/star', {
      method: 'POST',
      retry: 0,
      body: {
        ...input,
        action,
        version: version.value,
      },

      onResponseError({ response }) {
        errorMessage.value =
          response._data?.statusMessage ||
          'Tidak dapat menyimpan data. Coba lagi.'
      },
    })

    // Keep the accepted version even if the following read fail
    version.value = result.version
    savedInput.value = input

    await refresh()

    if (error.value) {
      errorMessage.value =
        'Data tersimpan, tetapi output belum dapat dimuat. Muat ulang halaman.'
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

async function submitStar() {
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
    <AppHeader title="STAR" back-to="/home" />

    <main class="page star-page">
      <form class="panel" @submit.prevent="submitStar">
        <fieldset class="star-fields" :disabled="saving">
          <div class="submit-row">
            <div class="form-field">
              <label for="star-count">Jumlah bintang</label>

              <input
                id="star-count"
                v-model="count"
                class="text-input"
                name="count"
                type="text"
                inputmode="numeric"
                pattern="[1-5]"
                maxlength="1"
                aria-describedby="star-count-help"
                required
              >
            </div>

            <button class="primary-button" type="submit">
              {{ saving ? 'Memproses…' : 'Submit' }}
            </button>
          </div>

          <p id="star-count-help" class="field-help">
            Masukkan satu angka dari 1 sampai 5.
          </p>

          <fieldset class="type-options">
            <legend>Tipe susunan</legend>

            <label
              v-for="option in options"
              :key="option.value"
              class="radio-option"
            >
              <input
                v-model="type"
                type="radio"
                name="star-type"
                :value="option.value"
                required
              >

              <span>{{ option.label }}</span>
            </label>
          </fieldset>
        </fieldset>
      </form>

      <p
        v-if="errorMessage && !confirmOpen"
        class="form-error"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <section class="panel" aria-labelledby="output-title">
        <h2 id="output-title">Output</h2>

        <div v-if="data?.record" aria-live="polite">
          <p class="output-description">
            Tipe {{ data.record.type }} · {{ data.record.count }} bintang
          </p>

          <pre class="star-output">{{ data.record.rows.join('\n') }}</pre>
        </div>

        <p v-else>Belum ada output.</p>
      </section>

      <div class="page-actions">
        <button
          class="primary-button"
          type="button"
          :disabled="saving"
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
          :disabled="saving"
          @click="discardAndLeave"
        >
          Buang
        </button>

        <button
          class="primary-button dialog-action"
          type="button"
          :disabled="saving"
          @click="saveAndLeave"
        >
          {{ saving ? 'Menyimpan…' : 'Simpan' }}
        </button>
      </template>
    </AppDialog>
  </div>
</template>

<style scoped>
.star-page {
  display: grid;
  gap: 1.5rem;
  max-width: 48rem;
}

.star-fields,
.type-options {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.type-options {
  display: grid;
  gap: 0.25rem;
  margin-top: 1.5rem;
}

legend {
  margin-bottom: 0.5rem;
  padding: 0;
  font-weight: 600;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 2.75rem;
  cursor: pointer;
}

.radio-option input {
  width: 1.25rem;
  height: 1.25rem;
  margin: 0;
  accent-color: var(--primary);
}

.output-description {
  color: #526579;
}

.star-output {
  margin: 1.5rem 0 0;
  overflow-x: auto;
  color: var(--primary);
  font-family: ui-monospace, monospace;
  font-size: 1.5rem;
  line-height: 1.8;
}
</style>