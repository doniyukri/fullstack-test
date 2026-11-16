export function formatMoney(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(value: string) {
  return (
    new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value)) + ' WIB'
  )
}

export function formatBirthDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { timeZone: 'UTC', dateStyle: 'long' }).format(
    new Date(`${value}T00:00:00Z`),
  )
}
