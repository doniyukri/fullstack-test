import { MongoServerError } from "mongodb"
import { starSaveSchema } from "#shared/calculator-inputs"
import type { StarRecord } from "../types/star.ts"
import { getDatabase } from "../utils/db.ts"
import { requireUser } from "../utils/session.ts"

const duplicateWindowMs = 60_000

function conflictError() {
  return createError({
    statusCode: 409,
    statusMessage: "Data telah berubah. Muat ulang sebelum menyimpan.",
  })
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  const body = await readBody(event)
  const parsed = starSaveSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Periksa jumlah bintang dan tipe susunan.",
    })
  }

  const { count, type, action, version } = parsed.data

  const db = await getDatabase()
  const collection = db.collection<StarRecord>("star_states")

  const current = await collection.findOne({
    _id: user.id,
  })

  const currentVersion = current?.version ?? 0

  if (version !== currentVersion) {
    throw conflictError()
  }

  const now = new Date()

  const unchanged =
    current !== null && current.count === count && current.type === type

  if (unchanged) {
    const elapsedMs = now.getTime() - current.updatedAt.getTime()

    if (action === "submit" && elapsedMs < duplicateWindowMs) {
      const retryAfter = Math.max(
        1,
        Math.ceil((duplicateWindowMs - elapsedMs) / 1000),
      )

      setHeader(event, "Retry-After", String(retryAfter))

      throw createError({
        statusCode: 429,
        statusMessage: `Data STAR sama. Tunggu ${retryAfter} detik.`,
      })
    }

    return {
      changed: false,
      version: current.version,
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
      await collection.insertOne(nextRecord)
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
    )

    if (result.matchedCount === 0) {
      throw conflictError()
    }
  }

  return {
    changed: true,
    version: nextRecord.version,
  }
})
