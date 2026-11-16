import type { ClientSession } from 'mongodb'
import type { Activity, ActivityChange } from '../../shared/activity.ts'
import { getDatabase, getMongoClient } from './db.ts'
import { saveWithAudit } from './audit-store.ts'
import type { ActivityRecord } from './audit-store.ts'

export async function auditTransaction<T>(
  user: { id: string; username: string },
  module: Activity['module'],
  action: Activity['action'],
  save: (session: ClientSession) => Promise<{ result: T; changes: ActivityChange[] }>,
): Promise<T> {
  const client = await getMongoClient()
  const db = await getDatabase()
  return saveWithAudit(
    client,
    db.collection<ActivityRecord>('activity_outbox'),
    user,
    module,
    action,
    save,
  )
}
