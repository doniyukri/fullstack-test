import assert from 'node:assert/strict'
import test from 'node:test'
import { getActivityChanges } from '../shared/activity.ts'
import { buildDemoEmployees } from '../scripts/demo-employees.ts'
import { createEmployeeSchema } from '../shared/employee.ts'
import { employeeGrades } from '../server/config/employee-grades.ts'

test('unchanged values do not create activity changes', () => {
  assert.deepEqual(getActivityChanges({ count: 4, type: 1 }, { count: 4, type: 1 }), [])
})

test('activity includes only fields that changed', () => {
  assert.deepEqual(getActivityChanges({ count: 4, type: 1 }, { count: 5, type: 1 }), [
    { field: 'count', before: 4, after: 5 },
  ])
})

test('new values have a null previous value', () => {
  assert.deepEqual(getActivityChanges({}, { amount: '1375' }), [
    { field: 'amount', before: null, after: '1375' },
  ])
})

test('reviewer demo has 25 valid employees and unique stable IDs', () => {
  const now = new Date('2026-11-16T00:00:00Z')
  const records = buildDemoEmployees('reviewer', now, 25)
  const schema = createEmployeeSchema(employeeGrades, '2026-11-16')
  assert.equal(records.length, 25)
  assert.equal(new Set(records.map((item) => item._id.toHexString())).size, 25)
  for (const record of records) {
    const { _id, userId, gradeName, provinceName, cityName, districtName, createdAt, ...input } =
      record
    assert.equal(schema.safeParse(input).success, true)
  }
})
