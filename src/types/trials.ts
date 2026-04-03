import type { Timestamp } from 'firebase/firestore'

export interface Trial {
  id: string
  nctId: string
  title: string
  status: string
  phase: string
  conditions: string[]
  interventions: string[]
  locations: string[]
  enrollmentCount: number | null
  startDate: string | null
  completionDate: string | null
  url: string
  summaryDe: string
  fetchedAt: Timestamp
}
