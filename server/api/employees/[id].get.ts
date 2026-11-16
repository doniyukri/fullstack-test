import { employeeIdSchema } from "#shared/employee-id"
import type { EmployeeRecord } from "../../types/employee.ts"
import { getDatabase } from "../../utils/db.ts"
import { getEmployeeDetails } from "../../utils/employee-details.ts"
import { requireUser } from "../../utils/session.ts"

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  const parsed = employeeIdSchema.safeParse(getRouterParam(event, "id"))

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID karyawan tidak valid",
    })
  }

  const db = await getDatabase()

  const employee = await getEmployeeDetails(
    db.collection<EmployeeRecord>("employees"),
    user.id,
    parsed.data,
  )

  if (!employee) {
    throw createError({
      statusCode: 404,
      statusMessage: "Data karyawan tidak ditemukan",
    })
  }

  return { employee }
})
