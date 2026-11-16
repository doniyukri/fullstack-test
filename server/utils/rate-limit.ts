import { createHash } from 'node:crypto'
import type { Collection } from 'mongodb'

export interface RateLimitRecord {
  _id: string
  count: number
  expiresAt: Date
}

function getWindow(key: string, windowMs: number, now: number) {
  const windowStart = Math.floor(now / windowMs) * windowMs
  const windowEnd = windowStart + windowMs

  const keyHash = createHash('sha256').update(key).digest('hex')

  return {
    id: `${keyHash}:${windowStart}`,
    expiresAt: new Date(windowEnd),
    retryAfter: Math.max(1, Math.ceil((windowEnd - now) / 1000)),
  }
}

export async function recordAttempt(
  collection: Collection<RateLimitRecord>,
  key: string,
  windowMs: number,
  now = Date.now(),
) {
  const window = getWindow(key, windowMs, now)

  // Let MongoDB increase the count so requests arriving together are not lost
  const record = await collection.findOneAndUpdate(
    { _id: window.id },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: window.expiresAt },
    },
    {
      upsert: true,
      returnDocument: 'after',
      includeResultMetadata: false,
    },
  )

  if (!record) {
    throw new Error('Could not update the rate limit.')
  }

  return {
    count: record.count,
    retryAfter: window.retryAfter,
  }
}

export async function getRateLimit(
  collection: Collection<RateLimitRecord>,
  key: string,
  windowMs: number,
  now = Date.now(),
) {
  const window = getWindow(key, windowMs, now)

  const record = await collection.findOne({
    _id: window.id,
  })

  return {
    count: record?.count ?? 0,
    retryAfter: window.retryAfter,
  }
}

export async function clearRateLimit(
  collection: Collection<RateLimitRecord>,
  key: string,
  windowMs: number,
  now = Date.now(),
) {
  const window = getWindow(key, windowMs, now)

  await collection.deleteOne({
    _id: window.id,
  })
}
