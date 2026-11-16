import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'
import { MongoClient } from 'mongodb'
import { listEmployees } from '../server/utils/employee-list.ts'

test('employee list keeps pages private and does not repeat records', async () => {
  assert.ok(process.env.NUXT_MONGO_URL)
  assert.ok(process.env.NUXT_MONGO_DATABASE)

  const client = new MongoClient(process.env.NUXT_MONGO_URL, {
    serverSelectionTimeoutMS: 5000,
  })

  await client.connect()

  const collection = client
    .db(process.env.NUXT_MONGO_DATABASE)
    .collection(`employee_list_test_${randomUUID().replaceAll('-', '')}`)

  try {
    const base = {
      position: 'Staff Admin',
      gradeId: '1',
      gradeName: 'Golongan 1',
      birthDate: '2000-05-12',
      baseSalary: 4_000_000,
      address: 'Test address',
      provinceId: '31',
      provinceName: 'Jakarta',
      cityId: '31.71',
      cityName: 'Jakarta Pusat',
      districtId: '31.71.01',
      districtName: 'Gambir',
      createdAt: new Date('2026-11-16T05:00:00.000Z'),
    }

    await collection.insertMany([
      ...Array.from({ length: 23 }, (_, index) => ({
        ...base,
        userId: 'owner-a',
        name: `Employee ${String(index).padStart(2, '0')}`,
      })),
      ...Array.from({ length: 5 }, () => ({
        ...base,
        userId: 'owner-b',
        name: 'Private employee',
      })),
    ])

    const today = '2026-11-16'

    const first = await listEmployees(collection, 'owner-a', {}, today)

    const second = await listEmployees(collection, 'owner-a', { cursor: first.nextCursor }, today)

    const third = await listEmployees(collection, 'owner-a', { cursor: second.nextCursor }, today)

    assert.deepEqual([first.items.length, second.items.length, third.items.length], [10, 10, 3])

    assert.equal(third.nextCursor, null)

    const all = [...first.items, ...second.items, ...third.items]

    assert.equal(new Set(all.map((item) => item.id)).size, 23)
    assert.ok(all.every((item) => item.name.startsWith('Employee ')))
    assert.ok(all.every((item) => !('baseSalary' in item)))

    const search = await listEmployees(collection, 'owner-a', { search: 'Employee 0' }, today)

    assert.equal(search.items.length, 10)
    assert.equal(search.nextCursor, null)

    const literalSearch = await listEmployees(collection, 'owner-a', { search: '.*' }, today)

    assert.equal(literalSearch.items.length, 0)

    const ageFilter = await listEmployees(collection, 'owner-a', { maxAge: 25 }, today)

    assert.equal(ageFilter.items.length, 0)

    const gradeFilter = await listEmployees(collection, 'owner-a', { gradeId: '2' }, today)

    assert.equal(gradeFilter.items.length, 0)
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
