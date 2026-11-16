import { z } from 'zod'

export const employeeIdSchema = z
  .string()
  .regex(/^[a-f0-9]{24}$/i)
  .transform((value) => value.toLowerCase())
