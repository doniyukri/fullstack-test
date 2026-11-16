import { ObjectId } from "mongodb"
import type { Collection, Filter } from "mongodb"
import { z } from "zod"
import type { EmployeeListQuery } from "../../shared/employee-list.ts"
import type { EmployeeRecord } from "../types/employee.ts"

const pageSize = 10

const cursorSchema = z.strictObject({
  createdAt: z.iso.datetime({ precision: 3 }),
  id: z.string().regex(/^[a-f0-9]{24}$/),
})

export function encodeEmployeeCursor(createdAt: Date, id: string) {
  const value = JSON.stringify({
    createdAt: createdAt.toISOString(),
    id,
  })

  return Buffer.from(value).toString("base64url")
}

export function decodeEmployeeCursor(value: string) {
  if (value.length > 256 || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error("Cursor tidak valid")
  }

  try {
    const json = Buffer.from(value, "base64url").toString("utf8")

    return cursorSchema.parse(JSON.parse(json))
  } catch {
    throw new Error("Cursor tidak valid")
  }
}

function dateYearsAgo(today: string, years: number): string {
  const date = new Date(`${today}T00:00:00Z`)
  const month = date.getUTCMonth()

  date.setUTCFullYear(date.getUTCFullYear() - years)

  // Clamp February 29 to February 28 when needed
  if (date.getUTCMonth() !== month) {
    date.setUTCDate(0)
  }

  return date.toISOString().slice(0, 10)
}

export function buildEmployeeFilter(
  userId: string,
  query: EmployeeListQuery,
  today: string,
): Filter<EmployeeRecord> {
  const conditions: Filter<EmployeeRecord>[] = [{ userId }]

  for (const field of [
    "gradeId",
    "provinceId",
    "cityId",
    "districtId",
  ] as const) {
    if (query[field]) {
      conditions.push({ [field]: query[field] })
    }
  }

  if (query.search) {
    const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

    conditions.push({
      $or: [
        { name: { $regex: escaped, $options: "i" } },
        { position: { $regex: escaped, $options: "i" } },
      ],
    })
  }

  const birthDate: {
    $lte?: string
    $gt?: string
  } = {}

  if (query.minAge !== undefined) {
    birthDate.$lte = dateYearsAgo(today, query.minAge)
  }

  if (query.maxAge !== undefined) {
    birthDate.$gt = dateYearsAgo(today, query.maxAge + 1)
  }

  if (Object.keys(birthDate).length > 0) {
    conditions.push({ birthDate })
  }

  if (query.cursor) {
    const cursor = decodeEmployeeCursor(query.cursor)
    const createdAt = new Date(cursor.createdAt)

    conditions.push({
      $or: [
        { createdAt: { $lt: createdAt } },
        {
          createdAt,
          _id: { $lt: new ObjectId(cursor.id) },
        },
      ],
    })
  }

  return { $and: conditions }
}

export async function listEmployees(
  collection: Collection<EmployeeRecord>,
  userId: string,
  query: EmployeeListQuery,
  today: string,
) {
  const filter = buildEmployeeFilter(userId, query, today)

  const records = await collection
    .find(filter)
    .project({
      _id: 1,
      name: 1,
      position: 1,
      gradeId: 1,
      gradeName: 1,
      cityName: 1,
      createdAt: 1,
    })
    .sort({ createdAt: -1, _id: -1 })
    .limit(pageSize + 1)
    .toArray()

  const hasMore = records.length > pageSize
  const page = records.slice(0, pageSize)
  const last = page.at(-1)

  return {
    items: page.map((employee) => ({
      id: employee._id.toHexString(),
      name: employee.name,
      position: employee.position,
      gradeId: employee.gradeId,
      gradeName: employee.gradeName,
      cityName: employee.cityName,
      createdAt: employee.createdAt,
    })),
    nextCursor:
      hasMore && last
        ? encodeEmployeeCursor(last.createdAt, last._id.toHexString())
        : null,
  }
}
