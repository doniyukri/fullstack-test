import test from "node:test"
import assert from "node:assert/strict"
import {
  starInputSchema,
  terbilangInputSchema,
} from "../shared/calculator-inputs.ts"

test("STAR accepts a valid input object", () => {
  const input = { count: 3, type: 2 }

  assert.deepEqual(starInputSchema.parse(input), input)
})

test("STAR requires numeric fields and one type", () => {
  const invalidInputs = [
    { count: "3", type: 1 },
    { count: 3 },
    { count: 3, type: "1" },
    { count: 3, type: [1, 2] },
  ]

  for (const input of invalidInputs) {
    assert.equal(starInputSchema.safeParse(input).success, false)
  }
})

test("STAR rejects invalid counts and unexpected fields", () => {
  const invalidInputs = [
    { count: 0, type: 1 },
    { count: 6, type: 1 },
    { count: 3, type: 1, userId: "another-user" },
  ]

  for (const input of invalidInputs) {
    assert.equal(starInputSchema.safeParse(input).success, false)
  }
})

test("Terbilang accepts an unformatted digit string", () => {
  const input = { amount: "1375" }

  assert.deepEqual(terbilangInputSchema.parse(input), input)
})

test("Terbilang rejects noncanonical amounts", () => {
  for (const amount of ["1,375", "01", "-1", "1.5", 1375, null]) {
    const result = terbilangInputSchema.safeParse({ amount })

    assert.equal(result.success, false)
  }
})
