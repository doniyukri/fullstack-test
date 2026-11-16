import assert from 'node:assert/strict'
import test from 'node:test'
import { terbilangSaveSchema } from '../shared/calculator-inputs.ts'

test('Terbilang save accepts both actions and supported amounts', () => {
  for (const action of ['submit', 'save']) {
    for (const amount of ['0', '1375', '999999999999999']) {
      const result = terbilangSaveSchema.safeParse({
        amount,
        action,
        version: 0,
      })

      assert.equal(result.success, true)
    }
  }
})

test('Terbilang save rejects invalid amounts, actions, and versions', () => {
  const valid = {
    amount: '1375',
    action: 'submit',
    version: 0,
  }

  const invalidInputs = [
    { ...valid, amount: '1,375' },
    { ...valid, amount: 1375 },
    { ...valid, amount: '01' },
    { ...valid, amount: '-1' },
    { ...valid, amount: '1.5' },
    { ...valid, amount: '1000000000000000' },
    { ...valid, action: 'delete' },
    { ...valid, version: -1 },
    { ...valid, version: 0.5 },
    { ...valid, version: '0' },
  ]

  for (const input of invalidInputs) {
    assert.equal(terbilangSaveSchema.safeParse(input).success, false)
  }
})

test('Terbilang save rejects a user ID supplied by the client', () => {
  const result = terbilangSaveSchema.safeParse({
    amount: '1375',
    action: 'submit',
    version: 0,
    userId: 'another-user',
  })

  assert.equal(result.success, false)
})
