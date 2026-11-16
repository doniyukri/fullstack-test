import test from 'node:test'
import assert from 'node:assert/strict'
import { buildStarRows } from '../shared/star.ts'

test('type 1 aligns rows to the left', () => {
  const actual = buildStarRows(3, 1)

  assert.deepEqual(actual, ['*', '* *', '* * *'])
})

test('type 2 aligns rows to the right', () => {
  const actual = buildStarRows(3, 2)

  assert.deepEqual(actual, ['    *', '  * *', '* * *'])
})

test('type 3 centers the rows', () => {
  const actual = buildStarRows(3, 3)

  assert.deepEqual(actual, ['  *', ' * *', '* * *'])
})

test('count 1 gives one star for all types', () => {
  for (const type of [1, 2, 3]) {
    assert.deepEqual(buildStarRows(1, type), ['*'])
  }
})

test('count 5 gives five rows ending with five stars', () => {
  for (const type of [1, 2, 3]) {
    const rows = buildStarRows(5, type)

    assert.equal(rows.length, 5)
    assert.equal(rows[4], '* * * * *')
  }
})

test('invalid counts are rejected', () => {
  const invalidCounts = [0, 6, 1.5, NaN, Infinity, '3', null, undefined]

  for (const count of invalidCounts) {
    assert.throws(() => buildStarRows(count, 1), RangeError)
  }
})

test('invalid types are rejected', () => {
  const invalidTypes = [0, 4, 1.5, '1', null, undefined]

  for (const type of invalidTypes) {
    assert.throws(() => buildStarRows(3, type), RangeError)
  }
})
