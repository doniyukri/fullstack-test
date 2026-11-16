import { z } from 'zod'
import type { Activity } from '../../shared/activity.ts'
import type { ActivityRecord } from './audit-store.ts'
import { getDatabase } from './db.ts'

let syncing: Promise<void> | undefined
let indexReady = false

function elasticHeaders(contentType: string): Record<string, string> {
  const authorization = useRuntimeConfig().elasticsearchAuthorization
  return {
    'Content-Type': contentType,
    ...(authorization ? { Authorization: authorization } : {}),
  }
}

async function elasticRequest(path: string, method: 'GET' | 'PUT' | 'POST', body?: unknown) {
  const config = useRuntimeConfig()
  const response = await fetch(`${config.elasticsearchUrl}/${path}`, {
    method,
    headers: elasticHeaders('application/json'),
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(5000),
  })
  const result = await response.json()
  if (!response.ok) throw new Error(`Elasticsearch returned ${response.status}`)
  return result
}

async function ensureIndex() {
  if (indexReady) return
  const index = useRuntimeConfig().elasticsearchIndex
  try {
    await elasticRequest(index, 'GET')
  } catch {
    try {
      await elasticRequest(index, 'PUT', {
        ...(String(useRuntimeConfig().elasticsearchServerless) === 'true'
          ? {}
          : { settings: { number_of_shards: 1, number_of_replicas: 0 } }),
        mappings: {
          properties: {
            id: { type: 'keyword' },
            userId: { type: 'keyword' },
            username: { type: 'keyword' },
            module: { type: 'keyword' },
            action: { type: 'keyword' },
            createdAt: { type: 'date' },
            changes: { type: 'object', enabled: false },
          },
        },
      })
    } catch {
      // Another request may have created the index
      await elasticRequest(index, 'GET')
    }
  }
  indexReady = true
}

export function syncActivity(userId?: string): Promise<void> {
  // A Home request waits for any current sync, then checks this user's pending records
  if (syncing) return userId ? syncing.then(() => syncActivity(userId)) : syncing
  syncing = (async () => {
    await ensureIndex()
    const db = await getDatabase()
    const outbox = db.collection<ActivityRecord>('activity_outbox')
    const pending = await outbox
      .find({ indexedAt: { $exists: false }, ...(userId ? { userId } : {}) })
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray()
    if (pending.length === 0) return
    const index = useRuntimeConfig().elasticsearchIndex

    // Reuse the activity ID so sending the same record again does not create a copy
    const lines =
      pending
        .flatMap(({ _id, indexedAt, ...activity }) => [
          JSON.stringify({ index: { _index: index, _id } }),
          JSON.stringify(activity),
        ])
        .join('\n') + '\n'

    const response = await fetch(`${useRuntimeConfig().elasticsearchUrl}/_bulk?refresh=wait_for`, {
      method: 'POST',
      headers: elasticHeaders('application/x-ndjson'),
      body: lines,
      signal: AbortSignal.timeout(8000),
    })
    const result = await response.json()
    if (!response.ok || result.errors) throw new Error('Activity sync failed')

    // Mark records as sent only after Elasticsearch accepts the whole batch
    await outbox.updateMany(
      { _id: { $in: pending.map((item) => item._id) } },
      { $set: { indexedAt: new Date() } },
    )
  })().finally(() => {
    syncing = undefined
  })
  return syncing
}

const cursorSchema = z.tuple([z.number().finite(), z.string().uuid()])

export async function readActivity(userId: string, cursor?: string) {
  let after: [number, string] | undefined
  if (cursor) {
    try {
      if (cursor.length > 256 || !/^[A-Za-z0-9_-]+$/.test(cursor)) throw new Error()
      after = cursorSchema.parse(JSON.parse(Buffer.from(cursor, 'base64url').toString()))
    } catch {
      throw createError({ statusCode: 400, statusMessage: 'Cursor tidak valid' })
    }
  }

  try {
    // A Home visit waits for pending changes to become searchable
    await syncActivity(userId)
    const result = await elasticRequest(
      `${useRuntimeConfig().elasticsearchIndex}/_search`,
      'POST',
      {
        size: 11,
        query: { term: { userId } },
        sort: [{ createdAt: 'desc' }, { id: 'desc' }],
        ...(after ? { search_after: after } : {}),
      },
    )
    const hits = result.hits.hits as { _source: Activity; sort: [number, string] }[]
    const page = hits.slice(0, 10)
    const last = page.at(-1)
    return {
      items: page.map(({ _source: { userId: owner, ...activity } }) => activity),
      nextCursor:
        hits.length > 10 && last
          ? Buffer.from(JSON.stringify(last.sort)).toString('base64url')
          : null,
    }
  } catch {
    throw createError({
      statusCode: 503,
      statusMessage: 'Riwayat belum tersedia. Data Anda tetap tersimpan',
    })
  }
}
