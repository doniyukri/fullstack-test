import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  use: {
    baseURL: 'http://localhost:3001',
    channel: 'chrome',
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --port 3001',
    url: 'http://localhost:3001/login',
    reuseExistingServer: true,
    timeout: 120000,
  },
})
