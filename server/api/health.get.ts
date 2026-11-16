import { getDatabase } from '../utils/db'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  try {
    const db = await getDatabase()
    await db.command({ ping: 1 })

    return { status: 'ok' }
  } catch {
    throw createError({
      statusCode: 503,
      statusMessage: 'Database belum tersedia.',
    })
  }
})
