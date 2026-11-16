import type { EmployeeInput } from '../../shared/employee.ts'

export interface EmployeeRecord extends EmployeeInput {
  userId: string
  gradeName: string
  provinceName: string
  cityName: string
  districtName: string
  createdAt: Date
}
