import { z } from "zod"

export interface EmployeeGrade {
  id: string
  name: string
  minSalary: number
  maxSalary: number | null
}

export function createEmployeeSchema(
  grades: readonly EmployeeGrade[],
  today: string,
) {
  const birthDateSchema = z.iso
    .date()
    .refine(
      (value) => value <= today,
      "Tanggal lahir tidak boleh melewati hari ini",
    )

  return z
    .strictObject({
      name: z.string().trim().min(1).max(100),
      position: z.string().trim().min(1).max(100),
      gradeId: z.string().trim().min(1).max(32),
      birthDate: birthDateSchema,
      baseSalary: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
      address: z.string().trim().min(1).max(500),
      provinceId: z.string().trim().min(1).max(32),
      cityId: z.string().trim().min(1).max(32),
      districtId: z.string().trim().min(1).max(32),
    })
    .superRefine((employee, context) => {
      const grade = grades.find((item) => item.id === employee.gradeId)

      if (!grade) {
        context.addIssue({
          code: "custom",
          path: ["gradeId"],
          message: "Pilih golongan yang tersedia",
        })

        return
      }

      const belowMinimum = employee.baseSalary < grade.minSalary

      const aboveMaximum =
        grade.maxSalary !== null && employee.baseSalary > grade.maxSalary

      if (belowMinimum || aboveMaximum) {
        context.addIssue({
          code: "custom",
          path: ["baseSalary"],
          message: "Gaji pokok tidak sesuai dengan golongan",
        })
      }
    })
}
