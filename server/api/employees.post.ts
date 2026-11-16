import { createEmployeeSchema } from "#shared/employee"
import { employeeGrades } from "../config/employee-grades.ts"
import type { EmployeeRecord } from "../types/employee.ts"
import { getTodayInJakarta } from "../utils/date.ts"
import { getDatabase } from "../utils/db.ts"
import { resolveEmployeeRegions } from "../utils/employee-regions.ts"
import { getCities, getDistricts, getProvinces } from "../utils/regions.ts"
import { requireUser } from "../utils/session.ts"

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody(event)

  const now = new Date()

  const schema = createEmployeeSchema(employeeGrades, getTodayInJakarta(now))

  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Periksa data karyawan",
      data: {
        issues: parsed.error.issues,
      },
    })
  }

  const input = parsed.data

  const regions = await resolveEmployeeRegions(input, {
    getProvinces,
    getCities,
    getDistricts,
  })

  if (!regions.success) {
    throw createError({
      statusCode: 400,
      statusMessage: regions.message,
      data: {
        issues: [
          {
            path: [regions.field],
            message: regions.message,
          },
        ],
      },
    })
  }

  const grade = employeeGrades.find((item) => item.id === input.gradeId)

  if (!grade) {
    throw createError({
      statusCode: 400,
      statusMessage: "Golongan tidak tersedia",
    })
  }

  const employee: EmployeeRecord = {
    ...input,
    userId: user.id,
    gradeName: grade.name,
    provinceName: regions.province.name,
    cityName: regions.city.name,
    districtName: regions.district.name,
    createdAt: now,
  }

  const db = await getDatabase()

  const result = await db
    .collection<EmployeeRecord>("employees")
    .insertOne(employee)

  setResponseStatus(event, 201)

  return {
    id: result.insertedId.toHexString(),
  }
})
