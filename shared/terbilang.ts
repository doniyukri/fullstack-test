const smallNumberWords = [
  "nol",
  "satu",
  "dua",
  "tiga",
  "empat",
  "lima",
  "enam",
  "tujuh",
  "delapan",
  "sembilan",
  "sepuluh",
  "sebelas",
]

export function spellUnderTwenty(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value > 19) {
    throw new RangeError("Nilai harus bilangan bulat 0–19.")
  }

  if (value < 12) {
    return smallNumberWords[value]!
  }

  const ones = value - 10
  return smallNumberWords[ones] + " belas"
}

export function spellUnderThousand(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value > 999) {
    throw new RangeError("Nilai harus bilangan bulat 0–999.")
  }

  if (value < 20) {
    return spellUnderTwenty(value)
  }

  if (value < 100) {
    const tens = Math.floor(value / 10)
    const ones = value % 10
    const prefix = spellUnderTwenty(tens) + " puluh"

    if (ones === 0) {
      return prefix
    }

    return prefix + " " + spellUnderTwenty(ones)
  }

  const hundreds = Math.floor(value / 100)
  const remainder = value % 100

  let prefix = "seratus"

  if (hundreds > 1) {
    prefix = spellUnderTwenty(hundreds) + " ratus"
  }

  if (remainder === 0) {
    return prefix
  }

  return prefix + " " + spellUnderThousand(remainder)
}