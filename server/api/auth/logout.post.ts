import { endSession } from '../../utils/session.ts'

export default defineEventHandler(async (event) => {
  await endSession(event)

  return { ok: true }
})
