import { readJsonBody } from '../utils/request-body.ts'
import { MongoServerError } from 'mongodb'
import { starSaveSchema } from '#shared/calculator-inputs'
import type { StarRecord } from '../types/star.ts'
import { getDatabase } from '../utils/db.ts'
import { requireUser } from '../utils/session.ts'
import { auditTransaction } from '../utils/audit.ts'
import { getActivityChanges } from '#shared/activity'

const duplicateWindowMs = 60_000

function conflictError() {
  return createError({
    statusCode: 409,
    statusMessage: 'Data telah berubah. Muat ulang sebelum menyimpan.',
  })
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  const body = await readJsonBody(event)
  const parsed = starSaveSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Periksa jumlah bintang dan tipe susunan.',
    })
  }

  const { count, type, action, version } = parsed.data

  const db = await getDatabase()
  const collection = db.collection<StarRecord>('star_states')

  return auditTransaction(user, 'STAR', action, async (session) => {
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

    const now = new Date()

    const unchanged = current !== null && current.count === count && current.type === type

    if (unchanged) {
      // Only repeated Submit gets the wait message; unchanged Save does not write again
      const elapsedMs = now.getTime() - current.updatedAt.getTime()

      if (action === 'submit' && elapsedMs < duplicateWindowMs) {
        const retryAfter = Math.max(1, Math.ceil((duplicateWindowMs - elapsedMs) / 1000))

        setHeader(event, 'Retry-After', retryAfter)

        throw createError({
          statusCode: 429,
          statusMessage: `Data STAR sama. Tunggu ${retryAfter} detik.`,
        })
      }

      return {
        result: { changed: false, version: current.version },
        changes: [],
      }
    }

    const nextRecord: StarRecord = {
      _id: user.id,
      count,
      type,
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
      changes: getActivityChanges(
        current ? { 'Jumlah bintang': current.count, 'Tipe susunan': current.type } : {},
        { 'Jumlah bintang': count, 'Tipe susunan': type },
      ),
    }
  })
})
