import { buildStarRows } from '#shared/star'
import type { StarRecord } from '../types/star.ts'
import { getDatabase } from '../utils/db.ts'
import { requireUser } from '../utils/session.ts'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = await getDatabase()

  const record = await db.collection<StarRecord>('star_states').findOne({
    _id: user.id,
  })

  if (!record) {
    return { record: null }
  }

  return {
    record: {
      count: record.count,
      type: record.type,
      version: record.version,
      updatedAt: record.updatedAt,
      rows: buildStarRows(record.count, record.type),
    },
  }
})
