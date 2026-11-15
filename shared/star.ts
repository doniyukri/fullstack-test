export type StarType = 1 | 2 | 3

export function buildStarRows(count: number, type: StarType): string[] {
  if (!Number.isInteger(count) || count < 1 || count > 5) {
    throw new RangeError("Jumlah bintang harus bilangan bulat 1–5.")
  }

  if (![1, 2, 3].includes(type)) {
    throw new RangeError("Pilih tipe susunan 1, 2, atau 3.")
  }

  const rows: string[] = []

  for (let starsInRow = 1; starsInRow <= count; starsInRow++) {
    const stars = Array(starsInRow).fill("*").join(" ")
    const missingStars = count - starsInRow

    let leadingSpaces = 0

    if (type === 2) {
      leadingSpaces = missingStars * 2
    } else if (type === 3) {
      leadingSpaces = missingStars
    }

    const row = " ".repeat(leadingSpaces) + stars
    rows.push(row)
  }

  return rows
}
