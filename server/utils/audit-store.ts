import { randomUUID } from 'node:crypto'
import type { ClientSession, Collection, MongoClient } from 'mongodb'
import type { Activity, ActivityChange } from '../../shared/activity.ts'

export interface ActivityRecord extends Activity {
  _id: string
  indexedAt?: Date
}

export async function saveWithAudit<T>(
  client: MongoClient,
  outbox: Collection<ActivityRecord>,
  user: { id: string; username: string },
  module: Activity['module'],
  action: Activity['action'],
  save: (session: ClientSession) => Promise<{ result: T; changes: ActivityChange[] }>,
): Promise<T> {
  return client.withSession(async (session) => {
    const result = await session.withTransaction(async () => {
      const saved = await save(session)

      // Save the data and activity in one transaction
      if (saved.changes.length > 0) {
        const id = randomUUID()
        await outbox.insertOne(
          {
            _id: id,
            id,
            userId: user.id,
            username: user.username,
            module,
            action,
            createdAt: new Date().toISOString(),
            changes: saved.changes,
          },
          { session },
        )
      }

      return saved.result
    })

    return result as T
  })
}
