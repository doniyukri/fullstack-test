import { employeeListQuerySchema } from "#shared/employee-list"
import { employeeGrades } from "../config/employee-grades.ts"
import type { EmployeeRecord } from "../types/employee.ts"
import { getTodayInJakarta } from "../utils/date.ts"
import { getDatabase } from "../utils/db.ts"
import { decodeEmployeeCursor, listEmployees } from "../utils/employee-list.ts"
import { requireUser } from "../utils/session.ts"

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  const parsed = employeeListQuerySchema.safeParse(getQuery(event))

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Periksa pencarian dan filter",
      data: {
        issues: parsed.error.issues,
      },
    })
  }

  const query = parsed.data

  if (
    query.gradeId &&
    !employeeGrades.some((grade) => grade.id === query.gradeId)
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Golongan tidak tersedia",
    })
  }

  if (query.cursor) {
    try {
      decodeEmployeeCursor(query.cursor)
    } catch {
      throw createError({
        statusCode: 400,
        statusMessage: "Cursor tidak valid",
      })
    }
  }

  const db = await getDatabase()

  return listEmployees(
    db.collection<EmployeeRecord>("employees"),
    user.id,
    query,
    getTodayInJakarta(),
  )
})
