import test from "node:test"
import assert from "node:assert/strict"
import { hashPassword, verifyPassword } from "../server/utils/password.ts"

const testPassword = "Only a test password 123!"
const storedHash = await hashPassword(testPassword)

test("the correct password is accepted", async () => {
  assert.equal(await verifyPassword(testPassword, storedHash), true)
})

test("an incorrect password is rejected", async () => {
  assert.equal(
    await verifyPassword("A different password 123!", storedHash),
    false,
  )
})

test("same password gives different hashes", async () => {
  const anotherHash = await hashPassword(testPassword)

  assert.notEqual(anotherHash, storedHash)
  assert.equal(await verifyPassword(testPassword, anotherHash), true)
})

test("password check fails when the hash is missing", async () => {
  assert.equal(await verifyPassword(testPassword), false)
})

test("invalid saved hashes return false", async () => {
  for (const hash of ["", "broken", "scrypt-v1:bad:bad"]) {
    assert.equal(await verifyPassword(testPassword, hash), false)
  }
})
