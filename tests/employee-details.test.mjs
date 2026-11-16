import assert from 'node:assert/strict'
import test from 'node:test'
import { employeeIdSchema } from '../shared/employee-id.ts'
import { createEmployeeSchema } from '../shared/employee.ts'
import { employeeGrades } from '../server/config/employee-grades.ts'
import { buildDemoEmployees } from '../scripts/demo-employees.ts'

const now = new Date('2026-11-16T05:00:00.000Z')

test('employee ID must contain 24 hex characters', () => {
  assert.equal(employeeIdSchema.parse('507F1F77BCF86CD799439011'), '507f1f77bcf86cd799439011')

  for (const id of ['', '123', 'z'.repeat(24), ['123']]) {
    assert.equal(employeeIdSchema.safeParse(id).success, false)
  }
})

test('demo employees contain 15 unique valid inputs', () => {
  const employees = buildDemoEmployees('owner-a', now)
  const schema = createEmployeeSchema(employeeGrades, '2026-11-16')

  assert.equal(employees.length, 15)

  assert.equal(new Set(employees.map((employee) => employee._id.toHexString())).size, 15)

  for (const employee of employees) {
    const { _id, userId, gradeName, provinceName, cityName, districtName, createdAt, ...input } =
      employee

    assert.equal(schema.safeParse(input).success, true)
    assert.ok(employee.name.endsWith('(Demo)'))
  }
})

test('demo IDs stay the same for one owner and differ between owners', () => {
  const first = buildDemoEmployees('owner-a', now)
  const repeated = buildDemoEmployees('owner-a', now)
  const anotherOwner = buildDemoEmployees('owner-b', now)

  const ids = (employees) => employees.map((employee) => employee._id.toHexString())

  assert.deepEqual(ids(first), ids(repeated))

  const firstIds = new Set(ids(first))

  assert.ok(ids(anotherOwner).every((id) => !firstIds.has(id)))
})
