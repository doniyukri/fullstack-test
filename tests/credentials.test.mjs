import test from 'node:test'
import assert from 'node:assert/strict'
import { credentialsSchema } from '../shared/credentials.ts'

const testPassword = '  This is a test password!  '

test('username is trimmed and lowercase, password stays the same', () => {
  const result = credentialsSchema.parse({
    username: ' Reviewer ',
    password: testPassword,
  })

  assert.deepEqual(result, {
    username: 'reviewer',
    password: testPassword,
  })
})

test('invalid usernames are rejected', () => {
  const invalidUsernames = ['', 'ab', 'name with spaces', 'name@example.com', 'a'.repeat(81)]

  for (const username of invalidUsernames) {
    const result = credentialsSchema.safeParse({
      username,
      password: testPassword,
    })

    assert.equal(result.success, false)
  }
})

test('password must have 12 to 128 characters', () => {
  for (const password of ['short', 'a'.repeat(129)]) {
    const result = credentialsSchema.safeParse({
      username: 'reviewer',
      password,
    })

    assert.equal(result.success, false)
  }
})
