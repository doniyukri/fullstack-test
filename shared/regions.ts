import { z } from "zod"

export const provinceIdSchema = z
  .string()
  .trim()
  .regex(/^\d{2}$/)

export const cityIdSchema = z
  .string()
  .trim()
  .regex(/^\d{2}\.\d{2}$/)

export const districtIdSchema = z
  .string()
  .trim()
  .regex(/^\d{2}\.\d{2}\.\d{2}$/)

export const regionListSchema = z.object({
  data: z
    .array(
      z.object({
        id: z.string().regex(/^\d{2}(?:\.\d{2}){0,2}$/),
        name: z.string().trim().min(1),
      }),
    )
    .min(1),
})

export type Region = z.infer<typeof regionListSchema>["data"][number]