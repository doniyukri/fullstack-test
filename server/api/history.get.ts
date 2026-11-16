import { readActivity } from '../utils/elasticsearch.ts'
import { requireUser } from '../utils/session.ts'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const cursor = getQuery(event).cursor
  if (cursor !== undefined && typeof cursor !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Cursor tidak valid' })
  }
  return readActivity(user.id, cursor)
})
