import assert from 'node:assert/strict'
import test from 'node:test'
import { loginSchema } from '../shared/login-input.ts'

test('login accepts credentials and a CAPTCHA token', () => {
  const result = loginSchema.parse({
    username: ' Reviewer ',
    password: ' example password ',
    captcha: 'example-token',
  })

  assert.deepEqual(result, {
    username: 'reviewer',
    password: ' example password ',
    captcha: 'example-token',
  })
})

test('login rejects a missing or empty CAPTCHA token', () => {
  const credentials = {
    username: 'reviewer',
    password: 'example password',
  }

  assert.equal(loginSchema.safeParse(credentials).success, false)

  assert.equal(
    loginSchema.safeParse({
      ...credentials,
      captcha: '',
    }).success,
    false,
  )
})

test('login rejects a CAPTCHA token longer than 2048 characters', () => {
  const result = loginSchema.safeParse({
    username: 'reviewer',
    password: 'example password',
    captcha: 'a'.repeat(2049),
  })

  assert.equal(result.success, false)
})
