import type { EmployeeInput } from './employee.ts'

export interface EmployeeDetails extends EmployeeInput {
  id: string
  gradeName: string
  provinceName: string
  cityName: string
  districtName: string
  createdAt: string
}

export type EmployeeListItem = Pick<
  EmployeeDetails,
  'id' | 'name' | 'position' | 'gradeId' | 'gradeName' | 'cityName' | 'createdAt'
>
