import test from "node:test"
import assert from "node:assert/strict"
import { spellUnderTwenty, spellUnderThousand } from "../shared/terbilang.ts"

const examples = [
  [0, "nol"],
  [1, "satu"],
  [9, "sembilan"],
  [10, "sepuluh"],
  [11, "sebelas"],
  [12, "dua belas"],
  [15, "lima belas"],
  [19, "sembilan belas"],
]

for (const [value, expected] of examples) {
  test(`${value} becomes "${expected}"`, () => {
    assert.equal(spellUnderTwenty(value), expected)
  })
}

test("the small-number helper rejects unsupported values", () => {
  for (const value of [-1, 20, 1.5, NaN, Infinity, "1", null]) {
    assert.throws(() => spellUnderTwenty(value), RangeError)
  }
})

const largerExamples = [
  [0, "nol"],
  [19, "sembilan belas"],
  [20, "dua puluh"],
  [21, "dua puluh satu"],
  [99, "sembilan puluh sembilan"],
  [100, "seratus"],
  [101, "seratus satu"],
  [110, "seratus sepuluh"],
  [111, "seratus sebelas"],
  [200, "dua ratus"],
  [375, "tiga ratus tujuh puluh lima"],
  [999, "sembilan ratus sembilan puluh sembilan"],
]

for (const [value, expected] of largerExamples) {
  test(`${value} is spelled correctly below one thousand`, () => {
    assert.equal(spellUnderThousand(value), expected)
  })
}

test("the hundreds helper rejects unsupported values", () => {
  for (const value of [-1, 1000, 1.5, NaN, Infinity, "100", null]) {
    assert.throws(() => spellUnderThousand(value), RangeError)
  }
})