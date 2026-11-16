import type { EmployeeGrade } from '../../shared/employee.ts'

// Salary is stored in whole rupiah
export const employeeGrades = [
  {
    id: '1',
    name: 'Golongan 1',
    minSalary: 3_000_000,
    maxSalary: 5_000_000,
  },
  {
    id: '2',
    name: 'Golongan 2',
    minSalary: 5_000_000,
    maxSalary: 10_000_000,
  },
  {
    id: '3',
    name: 'Golongan 3',
    minSalary: 10_000_001,
    maxSalary: null,
  },
] as const satisfies readonly EmployeeGrade[]
