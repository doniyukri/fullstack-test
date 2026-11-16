<script setup lang="ts">
interface TurnstileOptions {
  sitekey: string
  action: string
  size: 'compact'
  callback: (token: string) => void
  'expired-callback': () => void
  'error-callback': () => boolean
}

interface TurnstileApi {
  render: (container: HTMLElement, options: TurnstileOptions) => string
  remove: (id: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const token = defineModel<string>({ default: '' })

const config = useRuntimeConfig()
const container = ref<HTMLElement | null>(null)
const message = ref('Memuat CAPTCHA…')

let widgetId: string | undefined
let mounted = false

function startWidget() {
  const api = window.turnstile

  if (!mounted || !api || !container.value || widgetId !== undefined) {
    return
  }

  if (!config.public.turnstileSiteKey) {
    message.value = 'CAPTCHA belum dikonfigurasi.'
    return
  }

  try {
    widgetId = api.render(container.value, {
      sitekey: config.public.turnstileSiteKey,
      action: 'login',
      size: 'compact',

      callback(value) {
        token.value = value
        message.value = ''
      },

      'expired-callback'() {
        token.value = ''
        message.value = 'Selesaikan CAPTCHA kembali.'
      },

      'error-callback'() {
        token.value = ''
        message.value = 'CAPTCHA gagal dimuat. Muat ulang halaman.'
        return true
      },
    })

    message.value = ''
  } catch {
    message.value = 'CAPTCHA gagal dimuat. Muat ulang halaman.'
  }
}

useHead({
  script: [
    {
      key: 'turnstile',
      src: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
      async: true,
      defer: true,
      onload: startWidget,
      onerror: () => {
        message.value = 'CAPTCHA gagal dimuat. Muat ulang halaman.'
      },
    },
  ],
})

onMounted(() => {
  mounted = true
  startWidget()
})

onBeforeUnmount(() => {
  mounted = false

  if (widgetId !== undefined) {
    window.turnstile?.remove(widgetId)
  }
})
</script>

<template>
  <div class="captcha-widget">
    <div ref="container" />

    <p v-if="message" role="status">
      {{ message }}
    </p>
  </div>
</template>

<style scoped>
.captcha-widget {
  min-height: 140px;
}

p {
  margin: 0.5rem 0;
  font-size: 0.875rem;
}
</style>
