import { apiFetch } from './api'

export interface Reference {
  authors: string
  title: string
  source: string
  year: string
  doi?: string
  url?: string
}

export interface ReviewRound {
  round: number
  reviewedAt: string | null
  verdict: 'revision_needed' | 'approved' | 'major_issues'
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  methodologyCritique: string
  statisticalCritique: string
  citationCheck: string
}

export interface MetaStudySections {
  abstract: string
  introduction: string
  methods: string
  results: string
  discussion: string
  conclusion: string
}

export interface MetaStudy {
  id: string
  hypothesisId: string | null
  title: string
  status: string
  currentRound: number
  sections: MetaStudySections
  references: Reference[]
  paperIds: string[]
  searchStrategy: string | null
  inclusionCriteria: string[]
  exclusionCriteria: string[]
  reviews: ReviewRound[]
  wordCount: number
  createdAt: string | null
  updatedAt: string | null
  publishedAt: string | null
}

export interface MetaStudyDetail extends MetaStudy {
  hypothesisTitle: string | null
}

export async function getPublishedMetaStudies(): Promise<MetaStudy[]> {
  const response = await apiFetch<{ data: MetaStudy[] }>('/public/meta-studies')
  return response.data
}

export async function getMetaStudy(id: string): Promise<MetaStudyDetail | null> {
  try {
    return await apiFetch<MetaStudyDetail>(`/public/meta-studies/${id}`)
  } catch {
    return null
  }
}

export function formatDate(ts: string | null | undefined): string {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
