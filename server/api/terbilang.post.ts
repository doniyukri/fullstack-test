import { readJsonBody } from '../utils/request-body.ts'
import { MongoServerError } from 'mongodb'
import { terbilangSaveSchema } from '#shared/calculator-inputs'
import type { TerbilangRecord } from '../types/terbilang.ts'
import { getDatabase } from '../utils/db.ts'
import { requireUser } from '../utils/session.ts'
import { auditTransaction } from '../utils/audit.ts'
import { getActivityChanges } from '#shared/activity'

function conflictError() {
  return createError({
    statusCode: 409,
    statusMessage: 'Data telah berubah. Muat ulang sebelum menyimpan.',
  })
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  const body = await readJsonBody(event)
  const parsed = terbilangSaveSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Masukkan bilangan bulat 0–999,999,999,999,999.',
    })
  }

  const { amount, version, action } = parsed.data

  const db = await getDatabase()
  const collection = db.collection<TerbilangRecord>('terbilang_states')

  return auditTransaction(user, 'Terbilang', action, async (session) => {
    const current = await collection.findOne(
      {
        _id: user.id,
      },
      { session },
    )

    const currentVersion = current?.version ?? 0

    if (version !== currentVersion) {
      throw conflictError()
    }

    if (current && current.amount === amount) {
      return {
        result: { changed: false, version: current.version },
        changes: [],
      }
    }

    const now = new Date()

    const nextRecord: TerbilangRecord = {
      _id: user.id,
      amount,
      version: currentVersion + 1,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    }

    if (!current) {
      try {
        await collection.insertOne(nextRecord, { session })
      } catch (error) {
        if (error instanceof MongoServerError && error.code === 11000) {
          throw conflictError()
        }

        throw error
      }
    } else {
      const result = await collection.replaceOne(
        {
          _id: user.id,
          version: current.version,
        },
        nextRecord,
        { session },
      )

      if (result.matchedCount === 0) {
        throw conflictError()
      }
    }

    return {
      result: { changed: true, version: nextRecord.version },
      changes: getActivityChanges(current ? { Nominal: current.amount } : {}, { Nominal: amount }),
    }
  })
})
