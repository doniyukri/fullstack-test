const smallNumberWords = [
  'nol',
  'satu',
  'dua',
  'tiga',
  'empat',
  'lima',
  'enam',
  'tujuh',
  'delapan',
  'sembilan',
  'sepuluh',
  'sebelas',
]

export function spellUnderTwenty(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value > 19) {
    throw new RangeError('Nilai harus bilangan bulat 0–19.')
  }

  if (value < 12) {
    return smallNumberWords[value]!
  }

  const ones = value - 10
  return smallNumberWords[ones] + ' belas'
}

export function spellUnderThousand(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value > 999) {
    throw new RangeError('Nilai harus bilangan bulat 0–999.')
  }

  if (value < 20) {
    return spellUnderTwenty(value)
  }

  if (value < 100) {
    const tens = Math.floor(value / 10)
    const ones = value % 10
    const prefix = spellUnderTwenty(tens) + ' puluh'

    if (ones === 0) {
      return prefix
    }

    return prefix + ' ' + spellUnderTwenty(ones)
  }

  const hundreds = Math.floor(value / 100)
  const remainder = value % 100

  let prefix = 'seratus'

  if (hundreds > 1) {
    prefix = spellUnderTwenty(hundreds) + ' ratus'
  }

  if (remainder === 0) {
    return prefix
  }

  // Spell the part after the hundreds, such as 25 in 325
  return prefix + ' ' + spellUnderThousand(remainder)
}

const unitNames = ['', 'ribu', 'juta', 'miliar', 'triliun']

export function terbilang(raw: string): string {
  if (typeof raw !== 'string' || !/^(0|[1-9]\d{0,14})$/.test(raw)) {
    throw new RangeError('Masukkan bilangan bulat 0–999,999,999,999,999.')
  }

  let remaining = BigInt(raw)

  if (remaining === 0n) {
    return 'Nol rupiah'
  }

  const groups: string[] = []
  let unitIndex = 0

  while (remaining > 0n) {
    // Read three digits at a time, starting from the right
    const groupValue = Number(remaining % 1000n)

    if (groupValue > 0) {
      let groupWords = spellUnderThousand(groupValue)

      if (unitIndex === 1 && groupValue === 1) {
        // Use seribu instead of satu ribu
        groupWords = 'seribu'
      } else if (unitIndex > 0) {
        groupWords += ' ' + unitNames[unitIndex]!
      }

      // Put larger groups first because we read the number from the right
      groups.unshift(groupWords)
    }

    // BigInt division removes the remainder before reading the next group
    remaining = remaining / 1000n
    unitIndex++
  }

  const phrase = groups.join(' ') + ' rupiah'

  return phrase.charAt(0).toUpperCase() + phrase.slice(1)
}
