import type { H3Event } from "h3"
import { loginSchema } from "../../../shared/login-input.ts"
import type { UserRecord } from "../../types/user.ts"
import { verifyCaptcha } from "../../utils/captcha.ts"
import { getDatabase } from "../../utils/db.ts"
import { verifyPassword } from "../../utils/password.ts"
import {
  clearRateLimit,
  getRateLimit,
  recordAttempt,
} from "../../utils/rate-limit.ts"
import type { RateLimitRecord } from "../../utils/rate-limit.ts"
import { createSession } from "../../utils/session.ts"

const ipWindowMs = 60 * 1000
const ipRequestLimit = 20

const accountWindowMs = 15 * 60 * 1000
const accountFailureLimit = 10

function rejectRateLimit(event: H3Event, retryAfter: number): never {
  setHeader(event, "Retry-After", String(retryAfter))

  throw createError({
    statusCode: 429,
    statusMessage: `Terlalu banyak percobaan. Coba lagi dalam ${retryAfter} detik.`,
  })
}

export default defineEventHandler(async (event) => {
  const db = await getDatabase()
  const limits = db.collection<RateLimitRecord>("limits")

  // Use the connection IP instead of trusting a client-supplied header.
  const ip = getRequestIP(event, { xForwardedFor: false }) ?? "unknown"

  const ipLimit = await recordAttempt(limits, `login-ip:${ip}`, ipWindowMs)

  if (ipLimit.count > ipRequestLimit) {
    rejectRateLimit(event, ipLimit.retryAfter)
  }

  const body = await readBody(event)
  const parsed = loginSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Periksa username, password, dan CAPTCHA.",
    })
  }

  const { username, password, captcha } = parsed.data

  await verifyCaptcha(captcha)

  const accountKey = `login-account:${username}`

  const accountLimit = await getRateLimit(limits, accountKey, accountWindowMs)

  if (accountLimit.count >= accountFailureLimit) {
    rejectRateLimit(event, accountLimit.retryAfter)
  }

  const user = await db.collection<UserRecord>("users").findOne({
    username,
  })

  // The helper also performs password hashing when the user is missing.
  const passwordMatches = await verifyPassword(password, user?.passwordHash)

  if (!user || !passwordMatches) {
    await recordAttempt(limits, accountKey, accountWindowMs)

    throw createError({
      statusCode: 401,
      statusMessage: "Username atau password salah.",
    })
  }

  const sessionUser = {
    id: user._id.toHexString(),
    username: user.username,
  }

  await createSession(event, sessionUser)
  await clearRateLimit(limits, accountKey, accountWindowMs)

  return {
    user: sessionUser,
  }
})
