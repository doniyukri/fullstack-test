import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { MongoClient } from 'mongodb'
import { hashPassword } from '../server/utils/password.ts'

const base = process.env.NUXT_SITE_ORIGIN || 'http://localhost:3001'
const elasticUrl = process.env.NUXT_ELASTICSEARCH_URL || 'http://127.0.0.1:9201'
const index = process.env.NUXT_ELASTICSEARCH_INDEX || 'eci-activity'
const client = new MongoClient(process.env.NUXT_MONGO_URL)
await client.connect()
const db = client.db(process.env.NUXT_MONGO_DATABASE)
let userId
let insertedUserId
let stopped = false

const run = promisify(execFile)
async function docker(...args) {
  await run('docker', ['compose', ...args], { timeout: 120000 })
}

try {
  const username = `outage-${randomUUID()}`
  const password = randomUUID()
  const user = await db
    .collection('users')
    .insertOne({ username, passwordHash: await hashPassword(password), createdAt: new Date() })
  insertedUserId = user.insertedId
  userId = user.insertedId.toHexString()
  const login = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { Origin: base, 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, captcha: 'XXXX.DUMMY.TOKEN.XXXX' }),
  })
  assert.equal(login.status, 200)
  const cookie = login.headers
    .getSetCookie()
    .find((value) => value.startsWith('ec_submission_session='))
    ?.split(';')[0]
  assert.ok(cookie)
  stopped = true
  await docker('stop', 'elasticsearch')
  const saved = await fetch(`${base}/api/terbilang`, {
    method: 'POST',
    headers: { Origin: base, Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: '1375', action: 'submit', version: 0 }),
  })
  assert.equal(saved.status, 200)
  assert.equal(
    await db
      .collection('activity_outbox')
      .countDocuments({ userId, indexedAt: { $exists: false } }),
    1,
  )
  assert.equal((await fetch(`${base}/api/history`, { headers: { Cookie: cookie } })).status, 503)
  await docker('up', '-d', '--wait', 'elasticsearch')
  stopped = false
  const response = await fetch(`${base}/api/history`, { headers: { Cookie: cookie } })
  assert.equal(response.status, 200)
  const history = await response.json()
  assert.equal(history.items.length, 1)
  assert.equal(history.items[0].changes[0].after, '1375')
  console.log('PASS: Save and queued activity survive an Elasticsearch outage')
} finally {
  try {
    if (stopped) await docker('up', '-d', '--wait', 'elasticsearch')
    if (userId) {
      const events = await db.collection('activity_outbox').find({ userId }).toArray()
      for (const event of events) {
        await fetch(`${elasticUrl}/${index}/_doc/${event.id}?refresh=wait_for`, {
          method: 'DELETE',
        })
      }
      await db.collection('activity_outbox').deleteMany({ userId })
      await db.collection('sessions').deleteMany({ userId })
      await db.collection('terbilang_states').deleteOne({ _id: userId })
      await db
        .collection('users')
        .deleteOne({ username: { $regex: '^outage-' }, _id: insertedUserId })
    }
  } finally {
    await client.close()
  }
}
