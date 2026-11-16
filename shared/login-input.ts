import { z } from 'zod'
import { credentialsSchema } from './credentials.ts'

export const loginSchema = credentialsSchema.extend({
  captcha: z.string().min(1).max(2048),
})
