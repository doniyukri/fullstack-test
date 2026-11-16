import { z } from 'zod'
import { cityIdSchema, districtIdSchema, provinceIdSchema } from './regions.ts'

const ageSchema = z
  .string()
  .regex(/^(0|[1-9]\d{0,2})$/)
  .transform(Number)
  .pipe(z.number().max(150))

export const employeeListQuerySchema = z
  .strictObject({
    search: z.string().trim().max(80).optional(),
    gradeId: z.string().trim().min(1).max(32).optional(),
    minAge: ageSchema.optional(),
    maxAge: ageSchema.optional(),
    provinceId: provinceIdSchema.optional(),
    cityId: cityIdSchema.optional(),
    districtId: districtIdSchema.optional(),
    cursor: z.string().min(1).max(256).optional(),
  })
  .superRefine((query, context) => {
    if (query.minAge !== undefined && query.maxAge !== undefined && query.minAge > query.maxAge) {
      context.addIssue({
        code: 'custom',
        path: ['maxAge'],
        message: 'Umur maksimum harus sama atau lebih besar dari umur minimum',
      })
    }

    if (query.provinceId && query.cityId && !query.cityId.startsWith(`${query.provinceId}.`)) {
      context.addIssue({
        code: 'custom',
        path: ['cityId'],
        message: 'Kabupaten atau kota tidak sesuai dengan provinsi',
      })
    }

    if (
      query.districtId &&
      ((query.cityId && !query.districtId.startsWith(`${query.cityId}.`)) ||
        (query.provinceId && !query.districtId.startsWith(`${query.provinceId}.`)))
    ) {
      context.addIssue({
        code: 'custom',
        path: ['districtId'],
        message: 'Kecamatan tidak sesuai dengan wilayah yang dipilih',
      })
    }
  })

export type EmployeeListQuery = z.infer<typeof employeeListQuerySchema>
