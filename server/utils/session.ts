import { createHash, randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'
import type { SessionRecord } from '../types/session.ts'
import { getDatabase } from './db.ts'

const cookieName = 'ec_submission_session'
const sessionLifetimeSeconds = 8 * 60 * 60
const tokenPattern = /^[a-f0-9]{64}$/

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex')
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function createSession(event: H3Event, user: { id: string; username: string }) {
  const db = await getDatabase()
  const sessions = db.collection<SessionRecord>('sessions')
  const token = generateSessionToken()

  // Keep the token hash in MongoDB, not the login token
  await sessions.insertOne({
    _id: hashSessionToken(token),
    userId: user.id,
    username: user.username,
    expiresAt: new Date(Date.now() + sessionLifetimeSeconds * 1000),
  })

  // Remove the old session after login
  const previousToken = getCookie(event, cookieName)

  if (previousToken && tokenPattern.test(previousToken)) {
    await sessions.deleteOne({
      _id: hashSessionToken(previousToken),
    })
  }

  setCookie(event, cookieName, token, {
    httpOnly: true,
    secure: !import.meta.dev,
    sameSite: 'strict',
    path: '/',
    maxAge: sessionLifetimeSeconds,
  })
}

export async function requireUser(event: H3Event) {
  const token = getCookie(event, cookieName)

  if (!token || !tokenPattern.test(token)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Silakan masuk kembali.',
    })
  }

  const db = await getDatabase()

  // Check expiry here because MongoDB may remove expired records a little later
  const session = await db.collection<SessionRecord>('sessions').findOne({
    _id: hashSessionToken(token),
    expiresAt: { $gt: new Date() },
  })

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Sesi berakhir. Silakan masuk kembali.',
    })
  }

  return {
    id: session.userId,
    username: session.username,
  }
}

export async function endSession(event: H3Event) {
  const token = getCookie(event, cookieName)

  if (token && tokenPattern.test(token)) {
    const db = await getDatabase()

    await db.collection<SessionRecord>('sessions').deleteOne({
      _id: hashSessionToken(token),
    })
  }

  deleteCookie(event, cookieName, { path: '/' })
}
