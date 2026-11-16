import assert from "node:assert/strict"
import test from "node:test"
import { getTodayInJakarta } from "../server/utils/date.ts"

test("Jakarta date stays on the same day before midnight", () => {
  const now = new Date("2026-11-16T16:59:59Z")

  assert.equal(getTodayInJakarta(now), "2026-11-16")
})

test("Jakarta date changes at midnight WIB", () => {
  const now = new Date("2026-11-16T17:00:00Z")

  assert.equal(getTodayInJakarta(now), "2026-11-17")
})
