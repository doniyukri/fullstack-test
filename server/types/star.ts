import type { StarType } from "../../shared/star.ts"

export interface StarRecord {
  _id: string
  count: number
  type: StarType
  version: number
  createdAt: Date
  updatedAt: Date
}
