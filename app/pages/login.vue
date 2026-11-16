<script setup lang="ts">
import { Eye, EyeOff } from '@lucide/vue'
import { loginSchema } from '#shared/login-input'

const ready = ref(false)
onMounted(() => {
  ready.value = true
})

const username = ref('')
const password = ref('')
const captcha = ref('')

const showPassword = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const captchaKey = ref(0)

async function submitLogin() {
  if (submitting.value) {
    return
  }

  errorMessage.value = ''

  const parsed = loginSchema.safeParse({
    username: username.value,
    password: password.value,
    captcha: captcha.value,
  })

  if (!parsed.success) {
    errorMessage.value = 'Periksa username, password, dan CAPTCHA.'
    return
  }

  submitting.value = true

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: parsed.data,
      retry: 0,

      onResponseError({ response }) {
        errorMessage.value = response._data?.statusMessage || 'Tidak dapat masuk. Coba lagi.'
      },
    })
  } catch {
    if (!errorMessage.value) {
      errorMessage.value = 'Tidak dapat terhubung. Coba lagi.'
    }

    password.value = ''
    captcha.value = ''

    // A token may already have been used by the server
    captchaKey.value += 1

    return
  } finally {
    submitting.value = false
  }

  password.value = ''
  await navigateTo('/home')
}
</script>

<template>
  <div>
    <main class="page login-page">
      <section class="login-card" aria-labelledby="login-title">
        <h1 id="login-title" aria-label="Masuk ke eci.id">
          <AppLogo size="login" />
        </h1>

        <form class="login-form" :aria-busy="submitting" @submit.prevent="submitLogin">
          <div class="form-field">
            <label for="username">Username</label>

            <input
              id="username"
              v-model="username"
              class="text-input"
              name="username"
              type="text"
              autocomplete="username"
              autocapitalize="none"
              :spellcheck="false"
              minlength="3"
              maxlength="80"
              :disabled="submitting || !ready"
              required
            />
          </div>

          <div class="form-field">
            <label for="password">Password</label>

            <div class="password-field">
              <input
                id="password"
                v-model="password"
                class="text-input"
                name="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                minlength="12"
                maxlength="128"
                :disabled="submitting || !ready"
                required
              />

              <button
                class="icon-button password-toggle"
                type="button"
                :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
                :aria-pressed="showPassword"
                :disabled="submitting || !ready"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" :size="20" aria-hidden="true" />
                <Eye v-else :size="20" aria-hidden="true" />
              </button>
            </div>
          </div>

          <CaptchaWidget :key="captchaKey" v-model="captcha" />

          <p v-if="errorMessage" class="form-error" role="alert">
            {{ errorMessage }}
          </p>

          <button class="primary-button" type="submit" :disabled="submitting || !captcha || !ready">
            {{ submitting ? 'Memproses…' : 'Masuk' }}
          </button>
        </form>
      </section>
    </main>
  </div>
</template>

<style scoped>
.login-page {
  display: grid;
  place-items: start center;
  padding-top: clamp(2rem, 8vh, 5rem);
}

.login-card {
  width: 100%;
  max-width: 26rem;
  padding: 1.5rem;
  border: 1px solid #d6dee8;
  border-radius: 0.75rem;
  background: white;
}

h1 {
  display: flex;
  justify-content: center;
  margin: 0 0 1.5rem;
  font-size: 1.75rem;
}

.login-form {
  display: grid;
  gap: 1.25rem;
}

.password-field {
  position: relative;
}

.password-field input {
  padding-right: 3.25rem;
}

.password-toggle {
  position: absolute;
  top: 50%;
  right: 0.25rem;
  transform: translateY(-50%);
}
</style>
