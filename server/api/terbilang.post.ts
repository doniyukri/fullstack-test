import { MongoServerError } from "mongodb"
import { terbilangSaveSchema } from "#shared/calculator-inputs"
import type { TerbilangRecord } from "../types/terbilang.ts"
import { getDatabase } from "../utils/db.ts"
import { requireUser } from "../utils/session.ts"

function conflictError() {
  return createError({
    statusCode: 409,
    statusMessage: "Data telah berubah. Muat ulang sebelum menyimpan.",
  })
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  const body = await readBody(event)
  const parsed = terbilangSaveSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Masukkan bilangan bulat 0–999,999,999,999,999.",
    })
  }

  const { amount, version } = parsed.data

  const db = await getDatabase()
  const collection = db.collection<TerbilangRecord>("terbilang_states")

  const current = await collection.findOne({
    _id: user.id,
  })

  const currentVersion = current?.version ?? 0

  if (version !== currentVersion) {
    throw conflictError()
  }

  if (current && current.amount === amount) {
    return {
      changed: false,
      version: current.version,
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
