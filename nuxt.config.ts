// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    mongoUrl: '',
    mongoDatabase: 'electronic_city_submission',
    elasticsearchUrl: 'http://127.0.0.1:9201',
    elasticsearchAuthorization: '',
    elasticsearchServerless: false,
    elasticsearchIndex: 'eci-activity',
    siteOrigin: 'http://localhost:3001',
    turnstileSecret: '',

    public: {
      turnstileSiteKey: '',
    },
  },
})
