import test from "node:test"
import assert from "node:assert/strict"
import {
  spellUnderTwenty,
  spellUnderThousand,
  terbilang,
} from "../shared/terbilang.ts"

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

const amountExamples = [
  ["0", "Nol rupiah"],
  ["1000", "Seribu rupiah"],
  ["1001", "Seribu satu rupiah"],
  ["1010", "Seribu sepuluh rupiah"],
  ["1100", "Seribu seratus rupiah"],
  ["1375", "Seribu tiga ratus tujuh puluh lima rupiah"],
  ["2000", "Dua ribu rupiah"],
  ["1000000", "Satu juta rupiah"],
  ["1000001", "Satu juta satu rupiah"],
  ["1001000", "Satu juta seribu rupiah"],
  ["1000000000", "Satu miliar rupiah"],
  ["1000000000000", "Satu triliun rupiah"],
]

for (const [amount, expected] of amountExamples) {
  test(`${amount} becomes "${expected}"`, () => {
    assert.equal(terbilang(amount), expected)
  })
}

test("Terbilang supports the maximum amount", () => {
  const expected =
    "Sembilan ratus sembilan puluh sembilan triliun " +
    "sembilan ratus sembilan puluh sembilan miliar " +
    "sembilan ratus sembilan puluh sembilan juta " +
    "sembilan ratus sembilan puluh sembilan ribu " +
    "sembilan ratus sembilan puluh sembilan rupiah"

  assert.equal(terbilang("999999999999999"), expected)
})

test("Terbilang rejects invalid or formatted amounts", () => {
  const invalidAmounts = [
    "",
    "-1",
    "1.5",
    "1e3",
    "01",
    "1,375",
    "1000000000000000",
    " 1375 ",
    1375,
    null,
    undefined,
  ]

  for (const amount of invalidAmounts) {
    assert.throws(() => terbilang(amount), RangeError)
  }
})