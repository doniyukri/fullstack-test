import { z } from "zod"

export const starInputSchema = z.strictObject({
  count: z.number().int().min(1).max(5),
  type: z.union([z.literal(1), z.literal(2), z.literal(3)]),
})

export const starSaveSchema = starInputSchema.extend({
  action: z.enum(["submit", "save"]),
  version: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
})

export const terbilangInputSchema = z.strictObject({
  amount: z
    .string()
    .regex(
      /^(0|[1-9]\d{0,14})$/,
      "Masukkan bilangan bulat 0–999,999,999,999,999.",
    ),
})
