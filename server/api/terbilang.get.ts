import { terbilang } from '#shared/terbilang'
import type { TerbilangRecord } from '../types/terbilang.ts'
import { getDatabase } from '../utils/db.ts'
import { requireUser } from '../utils/session.ts'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = await getDatabase()

  const record = await db.collection<TerbilangRecord>('terbilang_states').findOne({ _id: user.id })

  if (!record) {
    return { record: null }
  }

  return {
    record: {
      amount: record.amount,
      text: terbilang(record.amount),
      version: record.version,
      updatedAt: record.updatedAt,
    },
  }
})
