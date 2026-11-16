import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import test from "node:test"
import { MongoClient } from "mongodb"
import {
  clearRateLimit,
  getRateLimit,
  recordAttempt,
} from "../server/utils/rate-limit.ts"

test("rate limits count requests, reset by time, and clear", async () => {
  const mongoUrl = process.env.NUXT_MONGO_URL
  const databaseName = process.env.NUXT_MONGO_DATABASE

  assert.ok(mongoUrl, "Set NUXT_MONGO_URL.")
  assert.ok(databaseName, "Set NUXT_MONGO_DATABASE.")

  const client = new MongoClient(mongoUrl, {
    serverSelectionTimeoutMS: 5000,
  })

  await client.connect()

  const collection = client
    .db(databaseName)
    .collection(`rate_limit_test_${randomUUID().replaceAll("-", "")}`)

  try {
    const now = Date.now()
    const windowMs = 60_000
    const key = "test-account"

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        recordAttempt(collection, key, windowMs, now),
      ),
    )

    assert.deepEqual(
      results.map((result) => result.count).sort((a, b) => a - b),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    )

    const current = await getRateLimit(collection, key, windowMs, now)

    assert.equal(current.count, 10)
    assert.ok(current.retryAfter >= 1)
    assert.ok(current.retryAfter <= 60)

    const nextWindow = await recordAttempt(
      collection,
      key,
      windowMs,
      now + windowMs,
    )

    assert.equal(nextWindow.count, 1)

    const otherAccount = await getRateLimit(
      collection,
      "another-account",
      windowMs,
      now,
    )

    assert.equal(otherAccount.count, 0)

    await clearRateLimit(collection, key, windowMs, now)

    const cleared = await getRateLimit(collection, key, windowMs, now)

    assert.equal(cleared.count, 0)
  } finally {
    try {
      await collection.drop()
    } catch (error) {
      if (error.code !== 26) {
        throw error
      }
    } finally {
      await client.close()
    }
  }
})
