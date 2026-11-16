import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'
import { MongoClient } from 'mongodb'
import { saveWithAudit } from '../server/utils/audit-store.ts'

test('data and activity commit together and roll back together', async () => {
  const client = new MongoClient(process.env.NUXT_MONGO_URL)
  await client.connect()
  const db = client.db(process.env.NUXT_MONGO_DATABASE)
  const prefix = `audit_test_${randomUUID().replaceAll('-', '')}`
  const records = db.collection(`${prefix}_records`)
  const outbox = db.collection(`${prefix}_outbox`)
  const user = { id: 'test-owner', username: 'test-user' }
  const changes = [{ field: 'count', before: null, after: 5 }]
  try {
    await outbox.createIndex({ userId: 1 }, { unique: true })
    const result = await saveWithAudit(client, outbox, user, 'STAR', 'submit', async (session) => {
      await records.insertOne({ count: 5 }, { session })
      return { result: { saved: true }, changes }
    })
    assert.deepEqual(result, { saved: true })
    assert.equal(await records.countDocuments({}), 1)
    assert.equal(await outbox.countDocuments({}), 1)

    // The unique test index forces an activity write failure
    await assert.rejects(() =>
      saveWithAudit(client, outbox, user, 'STAR', 'save', async (session) => {
        await records.insertOne({ count: 4 }, { session })
        return { result: { saved: true }, changes }
      }),
    )
    assert.equal(await records.countDocuments({}), 1)
    assert.equal(await outbox.countDocuments({}), 1)

    await saveWithAudit(client, outbox, user, 'STAR', 'save', async () => ({
      result: { saved: false },
      changes: [],
    }))
    assert.equal(await outbox.countDocuments({}), 1)
  } finally {
    await Promise.all([records.drop(), outbox.drop()])
    await client.close()
  }
})
