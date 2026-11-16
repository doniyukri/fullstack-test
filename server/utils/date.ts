export function getTodayInJakarta(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return [values.year, values.month, values.day].join('-')
}
