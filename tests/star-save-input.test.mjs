import assert from "node:assert/strict"
import test from "node:test"
import { starSaveSchema } from "../shared/calculator-inputs.ts"

test("STAR save accepts both actions", () => {
  for (const action of ["submit", "save"]) {
    const result = starSaveSchema.safeParse({
      count: 4,
      type: 3,
      action,
      version: 0,
    })

    assert.equal(result.success, true)
  }
})

test("STAR save rejects an invalid action or version", () => {
  const valid = {
    count: 4,
    type: 3,
    action: "submit",
    version: 0,
  }

  const invalidInputs = [
    { ...valid, action: "delete" },
    { ...valid, version: -1 },
    { ...valid, version: 1.5 },
    { ...valid, version: "0" },
  ]

  for (const input of invalidInputs) {
    assert.equal(starSaveSchema.safeParse(input).success, false)
  }
})

test("STAR save rejects a user ID supplied by the client", () => {
  const result = starSaveSchema.safeParse({
    count: 4,
    type: 3,
    action: "submit",
    version: 0,
    userId: "another-user",
  })

  assert.equal(result.success, false)
})
