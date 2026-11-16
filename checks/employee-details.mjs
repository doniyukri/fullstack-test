import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'
import { MongoClient } from 'mongodb'
import { seedDemoEmployees } from '../scripts/demo-employees.ts'
import { getEmployeeDetails } from '../server/utils/employee-details.ts'

test('demo seed preserves records and employee details stay private', async () => {
  assert.ok(process.env.NUXT_MONGO_URL)
  assert.ok(process.env.NUXT_MONGO_DATABASE)

  const client = new MongoClient(process.env.NUXT_MONGO_URL, {
    serverSelectionTimeoutMS: 5000,
  })

  await client.connect()

  const collection = client
    .db(process.env.NUXT_MONGO_DATABASE)
    .collection(`employee_details_test_${randomUUID().replaceAll('-', '')}`)

  try {
    const first = await seedDemoEmployees(collection, 'owner-a')

    assert.equal(first.upsertedCount, 15)

    const employee = await collection.findOne({ userId: 'owner-a' })

    assert.ok(employee)

    await collection.updateOne({ _id: employee._id }, { $set: { name: 'Changed demo name' } })

    const repeated = await seedDemoEmployees(collection, 'owner-a')

    assert.equal(repeated.upsertedCount, 0)
    assert.equal(await collection.countDocuments({ userId: 'owner-a' }), 15)

    const id = employee._id.toHexString()

    const ownDetails = await getEmployeeDetails(collection, 'owner-a', id)

    assert.equal(ownDetails.name, 'Changed demo name')
    assert.equal('userId' in ownDetails, false)

    const otherUserDetails = await getEmployeeDetails(collection, 'owner-b', id)

    assert.equal(otherUserDetails, null)

    const otherSeed = await seedDemoEmployees(collection, 'owner-b')

    assert.equal(otherSeed.upsertedCount, 15)
    assert.equal(await collection.countDocuments({}), 30)
  } finally {
    try {
      await collection.drop()
    } catch (error) {
      if (error.code !== 26) {
        throw error
      }
    } finally {
      await client.close()
    }
  }
})
