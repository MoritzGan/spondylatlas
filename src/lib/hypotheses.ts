import { apiFetch } from './api'

export type HypothesisStatus = 'pending_review' | 'open' | 'challenged' | 'needs_research'

export interface Hypothesis {
  id: string
  title: string
  description: string
  rationale: string
  paperIds: string[]
  status: HypothesisStatus
  generatedAt: string | null
  criticArgument?: string | null
  criticPaperIds?: string[]
  reviewedAt?: string | null
  commentCount?: number
}

export interface HypothesisComment {
  id: string
  hypothesisId: string
  content: string
  authorId: string
  authorName: string
  createdAt: string | null
  updatedAt?: string | null
}

export interface HypothesisDetail extends Hypothesis {
  comments: HypothesisComment[]
}

export async function getPublishedHypotheses(): Promise<Hypothesis[]> {
  const response = await apiFetch<{ data: Hypothesis[] }>('/public/hypotheses')
  return response.data
}

export async function getHypothesis(id: string): Promise<HypothesisDetail | null> {
  try {
    return await apiFetch<HypothesisDetail>(`/public/hypotheses/${id}`)
  } catch {
    return null
  }
}

export function subscribeHypotheses(cb: (h: Hypothesis[]) => void) {
  let cancelled = false

  const load = async () => {
    try {
      const hypotheses = await getPublishedHypotheses()
      if (!cancelled) {
        cb(hypotheses)
      }
    } catch {
      if (!cancelled) {
        cb([])
      }
    }
  }

  void load()
  const interval = window.setInterval(() => void load(), 30000)

  return () => {
    cancelled = true
    window.clearInterval(interval)
  }
}

export async function getComments(hypothesisId: string): Promise<HypothesisComment[]> {
  const detail = await apiFetch<HypothesisDetail>(`/public/hypotheses/${hypothesisId}`)
  return detail.comments
}

export async function addComment(
  hypothesisId: string,
  content: string,
  _authorId: string,
  _authorName: string,
): Promise<void> {
  await apiFetch<{ id: string }>(`/community/hypotheses/${hypothesisId}/comments`, {
    method: 'POST',
    requireAuth: true,
    body: { content },
  })
}

export function formatTs(ts: string | null | undefined): string {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/**
 * Bereinigt Critic-Texte, die noch rohe Firestore-Dokument-IDs enthalten.
 * Firestore-IDs sind genau 20 alphanumerische Zeichen — ein leicht erkennbares Muster.
 * Betrifft Einträge, die vor oder trotz dem Agent-Fix (#18) mit IDs gespeichert wurden.
 *
 * Beispiel: "Paper rtfu3ZjLMHc4VqMR6rLI zeigt..." → "Paper [Studie] zeigt..."
 */
export function sanitizeCriticText(text: string): string {
  return text.replace(/\b[A-Za-z0-9]{20}\b/g, '[Studie]')
}
