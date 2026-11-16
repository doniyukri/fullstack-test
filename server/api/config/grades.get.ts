import { employeeGrades } from "../../config/employee-grades.ts"
import { requireUser } from "../../utils/session.ts"

export default defineEventHandler(async (event) => {
  await requireUser(event)

  return {
    grades: employeeGrades,
  }
})
