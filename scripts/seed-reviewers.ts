import { createHash } from 'node:crypto'
import { MongoClient } from 'mongodb'
import { hashPassword } from '../server/utils/password.ts'
import { buildDemoEmployees, seedDemoEmployees } from './demo-employees.ts'
import type { EmployeeRecord } from '../server/types/employee.ts'
import type { StarRecord } from '../server/types/star.ts'
import type { TerbilangRecord } from '../server/types/terbilang.ts'

function activityId(key: string) {
  const hex = createHash('sha256').update(key).digest('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}

async function seedReviewers() {
  if (!process.env.NUXT_MONGO_URL || !process.env.NUXT_MONGO_DATABASE) {
    throw new Error('Set the MongoDB connection in .env')
  }
  const client = new MongoClient(process.env.NUXT_MONGO_URL, { serverSelectionTimeoutMS: 5000 })
  try {
    await client.connect()
    const db = client.db(process.env.NUXT_MONGO_DATABASE)
    await db.collection('users').createIndex({ username: 1 }, { unique: true })
    await db.collection('employees').createIndex({ userId: 1, createdAt: -1, _id: -1 })
    await db.collection('activity_outbox').createIndex({ indexedAt: 1 })
    for (const name of ['sessions', 'limits']) {
      await db.collection(name).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
    }

    for (let index = 1; index <= 10; index += 1) {
      const username = `reviewer${index}`
      // These accounts are only for reviewing the demo
      const passwordHash = await hashPassword('testting123456')
      await db.collection('users').updateOne({ username }, {
        $set: { passwordHash }, $setOnInsert: { createdAt: new Date() },
      }, { upsert: true })
      console.log(`Ready: ${username}`)
    }

    const user = await db.collection('users').findOne({ username: 'reviewer1' })
    if (!user) throw new Error('Reviewer account was not found')
    const userId = user._id.toHexString()
    const now = new Date()
    await seedDemoEmployees(db.collection<EmployeeRecord>('employees'), userId, now, 25)
    await db.collection<StarRecord>('star_states').updateOne({ _id: userId }, {
      $setOnInsert: { count: 5, type: 3, version: 1, createdAt: now, updatedAt: now },
    }, { upsert: true })
    await db.collection<TerbilangRecord>('terbilang_states').updateOne({ _id: userId }, {
      $setOnInsert: { amount: '1375', version: 1, createdAt: now, updatedAt: now },
    }, { upsert: true })

    const examples = [
      { key: 'star', module: 'STAR', changes: [{ field: 'Jumlah bintang', before: null, after: 5 }, { field: 'Tipe susunan', before: null, after: 3 }], createdAt: now.toISOString() },
      { key: 'terbilang', module: 'Terbilang', changes: [{ field: 'Nominal', before: null, after: '1375' }], createdAt: now.toISOString() },
      ...buildDemoEmployees(userId, now, 25).map((employee) => ({
        key: employee._id.toHexString(), module: 'Form Karyawan',
        changes: [{ field: 'Nama', before: null, after: employee.name }], createdAt: employee.createdAt.toISOString(),
      })),
    ]
    for (const example of examples) {
      const id = activityId(`${userId}:${example.key}`)
      await db.collection<{ _id: string }>('activity_outbox').updateOne({ _id: id }, {
        $setOnInsert: {
          id, userId, username: 'reviewer1', module: example.module,
          action: 'save', createdAt: example.createdAt, changes: example.changes, demo: true,
        },
      }, { upsert: true })
    }
    console.log('Reviewer1 has STAR, Terbilang, and 25 demo employees')
  } finally {
    await client.close()
  }
}

seedReviewers().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
