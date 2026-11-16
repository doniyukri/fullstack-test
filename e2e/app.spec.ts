import { test, expect } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { loadEnvFile } from 'node:process'
import { MongoClient, ObjectId } from 'mongodb'

const origin = 'http://localhost:3001'

async function login(request: APIRequestContext, username = 'reviewer1') {
  const response = await request.post('/api/auth/login', {
    headers: { Origin: origin },
    data: { username, password: 'testting123456', captcha: 'XXXX.DUMMY.TOKEN.XXXX' },
  })
  expect(response.status()).toBe(200)
}

test('login works on a phone and logout needs confirmation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/login')
  await expect(page.locator('header')).toHaveCount(0)
  await expect(page.getByAltText('eci.id')).toBeVisible()
  await page.getByLabel('Username', { exact: true }).fill('reviewer1')
  await page.getByLabel('Password', { exact: true }).fill('testting123456')
  await expect(page.getByRole('button', { name: 'Masuk', exact: true })).toBeEnabled({
    timeout: 45000,
  })
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await expect(page).toHaveURL('/home')
  await expect(page.getByRole('heading', { name: 'Log History' })).toBeVisible()
  await page.getByRole('button', { name: 'Keluar', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Batal', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: 'Keluar', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Keluar', exact: true }).click()
  await expect(page).toHaveURL('/login')
  await page.goto('/home')
  await expect(page).toHaveURL('/login')
})

test('employee pages return 10 then 10 then 5 private records', async ({ request, playwright }) => {
  await login(request)
  const first = await request.get('/api/employees').then((response) => response.json())
  const second = await request
    .get('/api/employees', { params: { cursor: first.nextCursor } })
    .then((response) => response.json())
  const third = await request
    .get('/api/employees', { params: { cursor: second.nextCursor } })
    .then((response) => response.json())
  expect([first.items.length, second.items.length, third.items.length]).toEqual([10, 10, 5])
  expect(
    new Set([...first.items, ...second.items, ...third.items].map((item) => item.id)).size,
  ).toBe(25)
  expect(third.nextCursor).toBeNull()
  const other = await playwright.request.newContext({ baseURL: origin })
  await login(other, 'reviewer2')
  expect((await other.get(`/api/employees/${first.items[0].id}`)).status()).toBe(404)
  expect((await other.get('/api/employees').then((response) => response.json())).items).toEqual([])
  await other.dispose()
})

test('employee search filters and details work without page overflow', async ({ page }) => {
  await login(page.request)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/form-input')
  await page.getByText('Input Karyawan', { exact: true }).click()
  await page.locator('.record-card').last().scrollIntoViewIfNeeded()
  await expect(page.locator('.record-card')).toHaveCount(20)
  await page.locator('.record-card').last().scrollIntoViewIfNeeded()
  await expect(page.locator('.record-card')).toHaveCount(25)
  await page.getByRole('searchbox', { name: 'Cari nama atau jabatan' }).fill('Rina')
  await expect(page.getByRole('button', { name: /Rina Putri/ })).toHaveCount(1)
  await page.getByRole('button', { name: /Rina Putri/ }).click()
  await expect(page.getByRole('dialog')).toContainText('Gambir')
  await expect(page.getByRole('dialog')).toContainText('Rp')
  await page.getByRole('button', { name: 'Tutup', exact: true }).click()
  await page.getByRole('searchbox').fill('')
  await page.getByRole('button', { name: 'Filter karyawan', exact: true }).click()
  await page.getByRole('dialog').getByLabel('Golongan', { exact: true }).selectOption('2')
  await page.getByLabel('Umur minimum').fill('20')
  await page.getByLabel('Umur maksimum').fill('60')
  await page.getByRole('button', { name: 'Terapkan', exact: true }).click()
  await expect(page.locator('.record-card').first()).toContainText('Gol. 2')
  await expect(page.locator('.filter-count')).toHaveText('3')
  const widths = await page.evaluate(() => [innerWidth, document.documentElement.scrollWidth])
  expect(widths[1]).toBeLessThanOrEqual(widths[0])
})

test('employee form saves a record and returns trusted details', async ({ page }) => {
  await login(page.request, 'reviewer10')
  const name = `Browser check ${randomUUID()} (Demo)`
  let id: string | undefined
  try {
    await page.goto('/form-input')
    await page.getByLabel('Nama', { exact: true }).fill(name)
    await page.getByLabel('Jabatan', { exact: true }).fill('Staff Admin')
    await page.getByLabel('Golongan', { exact: true }).selectOption('1')
    await page.getByLabel('Tanggal lahir', { exact: true }).fill('1990-05-12')
    await page.getByLabel('Gaji pokok', { exact: true }).fill('4000000')
    await page.getByLabel('Alamat', { exact: true }).fill('Jalan Uji Browser 10')
    await page.getByLabel('Provinsi', { exact: true }).selectOption('31')
    await page.getByLabel('Kabupaten/kota', { exact: true }).selectOption('31.71')
    await page.getByLabel('Kecamatan', { exact: true }).selectOption('31.71.01')
    await page.getByRole('button', { name: 'Simpan', exact: true }).click()
    await expect(page.getByText('Data karyawan tersimpan', { exact: true })).toBeVisible()
    const result = await page.request
      .get('/api/employees', { params: { search: name } })
      .then((response) => response.json())
    expect(result.items).toHaveLength(1)
    id = result.items[0].id
    const details = await page.request
      .get(`/api/employees/${id}`)
      .then((response) => response.json())
    expect(details.employee.baseSalary).toBe(4000000)
    expect(details.employee.districtName).toBe('Gambir')
    const history = await page.request.get('/api/history').then((response) => response.json())
    expect(history.items[0].module).toBe('Form Karyawan')
    expect(JSON.stringify(history.items[0])).not.toContain('Jalan Uji Browser 10')
  } finally {
    // Remove only the record created by this browser test
    loadEnvFile()
    const client = new MongoClient(process.env.NUXT_MONGO_URL!)
    await client.connect()
    try {
      const db = client.db(process.env.NUXT_MONGO_DATABASE)
      const owner = await db.collection('users').findOne({ username: 'reviewer10' })
      if (owner) {
        const userId = owner._id.toHexString()
        if (!id)
          id = (await db.collection('employees').findOne({ name, userId }))?._id.toHexString()
        if (id) await db.collection('employees').deleteOne({ _id: new ObjectId(id), userId, name })
        const events = await db
          .collection('activity_outbox')
          .find({ userId, changes: { $elemMatch: { field: 'Nama', after: name } } })
          .toArray()
        for (const event of events) {
          await fetch(
            `${process.env.NUXT_ELASTICSEARCH_URL || 'http://127.0.0.1:9201'}/${process.env.NUXT_ELASTICSEARCH_INDEX || 'eci-activity'}/_doc/${event.id}?refresh=wait_for`,
            { method: 'DELETE' },
          )
        }
        await db
          .collection('activity_outbox')
          .deleteMany({ userId, changes: { $elemMatch: { field: 'Nama', after: name } } })
      }
    } finally {
      await client.close()
    }
  }
})

test('STAR confirms unsaved input and Home shows the saved activity', async ({ page }) => {
  await login(page.request)
  const previous = await page.request.get('/api/star').then((response) => response.json())
  const count = previous.record.count === 5 ? 4 : 5
  await page.goto('/star')
  await page.getByLabel('Jumlah bintang').fill(String(count))
  await page.getByRole('button', { name: 'Save & kembali' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('dialog').getByRole('button', { name: 'Simpan', exact: true }).click()
  await expect(page).toHaveURL('/home')
  await expect(page.locator('.record-card').first()).toContainText('STAR')
  await page.locator('.record-card').first().click()
  await expect(page.getByRole('dialog')).toContainText('Jumlah bintang')
  const saved = await page.request.get('/api/star').then((response) => response.json())
  const historyBefore = await page.request.get('/api/history').then((response) => response.json())
  const unchanged = await page.request.post('/api/star', {
    headers: { Origin: origin },
    data: { count, type: saved.record.type, action: 'save', version: saved.record.version },
  })
  expect((await unchanged.json()).changed).toBe(false)
  const historyAfter = await page.request.get('/api/history').then((response) => response.json())
  expect(historyAfter.items.map((item) => item.id)).toEqual(
    historyBefore.items.map((item) => item.id),
  )
  const duplicate = await page.request.post('/api/star', {
    headers: { Origin: origin },
    data: { count, type: saved.record.type, action: 'submit', version: saved.record.version },
  })
  expect(duplicate.status()).toBe(429)
})

test('Terbilang formats input and shows API output in quotes', async ({ page }) => {
  await login(page.request)
  await page.goto('/terbilang')
  await page.getByLabel('Nominal (Rp)').fill('123456')
  await expect(page.getByLabel('Nominal (Rp)')).toHaveValue('123,456')
  await page.getByRole('button', { name: 'Submit', exact: true }).click()
  await expect(page.locator('.terbilang-output')).toContainText(
    '"Seratus dua puluh tiga ribu empat ratus lima puluh enam rupiah"',
  )
  await page.getByRole('button', { name: 'Save & kembali' }).click()
  await expect(page).toHaveURL('/home')
})
