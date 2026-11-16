import assert from 'node:assert/strict'
import test from 'node:test'
import { employeeListQuerySchema } from '../shared/employee-list.ts'
import {
  buildEmployeeFilter,
  decodeEmployeeCursor,
  encodeEmployeeCursor,
} from '../server/utils/employee-list.ts'

test('employee query accepts search and whole-number ages', () => {
  const result = employeeListQuerySchema.parse({
    search: ' Rina ',
    minAge: '20',
    maxAge: '30',
  })

  assert.equal(result.search, 'Rina')
  assert.equal(result.minAge, 20)
  assert.equal(result.maxAge, 30)

  for (const minAge of ['', '-1', '1.5', '151', ['20']]) {
    assert.equal(employeeListQuerySchema.safeParse({ minAge }).success, false)
  }
})

test('employee query rejects conflicting filters', () => {
  const cases = [
    { minAge: '40', maxAge: '20' },
    { provinceId: '31', cityId: '32.73' },
    { cityId: '31.71', districtId: '32.73.01' },
    { provinceId: '31', districtId: '32.73.01' },
    { userId: 'another-user' },
  ]

  for (const query of cases) {
    assert.equal(employeeListQuerySchema.safeParse(query).success, false)
  }
})

test('employee cursor round trip keeps the date and ID', () => {
  const date = new Date('2026-11-16T05:00:00.000Z')
  const id = '507f1f77bcf86cd799439011'

  const cursor = encodeEmployeeCursor(date, id)

  assert.deepEqual(decodeEmployeeCursor(cursor), {
    createdAt: date.toISOString(),
    id,
  })

  for (const invalid of ['', '!', 'abc', 'a'.repeat(257)]) {
    assert.throws(() => decodeEmployeeCursor(invalid))
  }
})

test('age filters use complete birthdays and handle leap years', () => {
  const filter = buildEmployeeFilter('owner', { minAge: 20, maxAge: 30 }, '2026-11-16')

  assert.deepEqual(filter.$and[1], {
    birthDate: {
      $lte: '2006-11-16',
      $gt: '1995-11-16',
    },
  })

  const leapFilter = buildEmployeeFilter('owner', { minAge: 1 }, '2024-02-29')

  assert.deepEqual(leapFilter.$and[1], {
    birthDate: { $lte: '2023-02-28' },
  })
})

test('search stays literal and keeps the owner filter', () => {
  const filter = buildEmployeeFilter('owner', { search: 'Rina (Demo).*' }, '2026-11-16')

  assert.deepEqual(filter.$and[0], { userId: 'owner' })

  const pattern = filter.$and[1].$or[0].name.$regex
  const regex = new RegExp(pattern, 'i')

  assert.equal(regex.test('Rina (Demo).*'), true)
  assert.equal(regex.test('Rina anything'), false)
})
