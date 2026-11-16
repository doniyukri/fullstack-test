export interface ActivityChange {
  field: string
  before: string | number | null
  after: string | number | null
}

export interface Activity {
  id: string
  userId: string
  username: string
  module: 'STAR' | 'Terbilang' | 'Form Karyawan'
  action: 'submit' | 'save'
  createdAt: string
  changes: ActivityChange[]
  demo?: boolean
}

export function getActivityChanges(
  before: Record<string, string | number | null>,
  after: Record<string, string | number | null>,
): ActivityChange[] {
  return Object.entries(after)
    .filter(([field, value]) => (before[field] ?? null) !== value)
    .map(([field, value]) => ({ field, before: before[field] ?? null, after: value }))
}
