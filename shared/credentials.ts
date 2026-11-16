import { z } from 'zod'

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(80)
  .regex(/^[a-z0-9._-]+$/)

export const passwordSchema = z.string().min(12).max(128)

export const credentialsSchema = z.strictObject({
  username: usernameSchema,
  password: passwordSchema,
})
