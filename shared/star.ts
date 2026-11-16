export type StarType = 1 | 2 | 3

export function buildStarRows(count: number, type: StarType): string[] {
  if (!Number.isInteger(count) || count < 1 || count > 5) {
    throw new RangeError('Jumlah bintang harus bilangan bulat 1–5.')
  }

  if (![1, 2, 3].includes(type)) {
    throw new RangeError('Pilih tipe susunan 1, 2, atau 3.')
  }

  const rows: string[] = []

  // Include all rows from one star up to the requested count
  for (let starsInRow = 1; starsInRow <= count; starsInRow++) {
    const stars = Array(starsInRow).fill('*').join(' ')
    const missingStars = count - starsInRow

    let leadingSpaces = 0

    if (type === 2) {
      // Each missing star also leaves one gap, so use two spaces
      leadingSpaces = missingStars * 2
    } else if (type === 3) {
      // Half the right alignment padding puts the rows in the middle
      leadingSpaces = missingStars
    }

    const row = ' '.repeat(leadingSpaces) + stars
    rows.push(row)
  }

  return rows
}
