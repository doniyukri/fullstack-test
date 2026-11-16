import test from 'node:test'
import assert from 'node:assert/strict'
import { generateSessionToken, hashSessionToken } from '../server/utils/session.ts'

test('session token has 64 hex characters', () => {
  const token = generateSessionToken()

  assert.match(token, /^[a-f0-9]{64}$/)
})

test('same token gives the same hash', () => {
  const token = generateSessionToken()
  const hash = hashSessionToken(token)

  assert.match(hash, /^[a-f0-9]{64}$/)
  assert.equal(hashSessionToken(token), hash)
  assert.notEqual(hash, token)
})

test('new session tokens are different', () => {
  assert.notEqual(generateSessionToken(), generateSessionToken())
})
