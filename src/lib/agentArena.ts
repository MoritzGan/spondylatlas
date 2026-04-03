import { apiFetch } from './api'

export type EventType = 'start' | 'step' | 'complete' | 'error' | 'skip'
export type AgentName =
  | 'paper-search'
  | 'evidence-grader'
  | 'summary-writer'
  | 'trial-tracker'
  | 'forum-moderator'
  | `external:${string}`

export interface AgentEvent {
  id: string
  agent: AgentName
  runId: string | null
  type: EventType
  message: string
  detail: string | null
  timestamp: string | null
}

export interface AgentRun {
  id: string
  agent: AgentName
  runId: string
  status: 'running' | 'complete' | 'error'
  startedAt: string | null
  completedAt: string | null
  itemsProcessed: number
  summary: string
}

export const AGENT_META: Record<string, { label: string; emoji: string; color: string }> = {
  'paper-search': { label: 'Paper Search', emoji: '', color: 'blue' },
  'evidence-grader': { label: 'Evidence Grader', emoji: '', color: 'purple' },
  'summary-writer': { label: 'Summary Writer', emoji: '', color: 'green' },
  'trial-tracker': { label: 'Trial Tracker', emoji: '', color: 'orange' },
  'forum-moderator': { label: 'Forum Moderator', emoji: '', color: 'red' },
  'hypothesis-generator': { label: 'Hypothesis Generator', emoji: '', color: 'yellow' },
  'hypothesis-critic': { label: 'Hypothesis Critic', emoji: '', color: 'indigo' },
}

export function getAgentMeta(name: string) {
  return AGENT_META[name] ?? {
    label: name.replace('external:', ''),
    emoji: '',
    color: 'gray',
  }
}

type ArenaPayload = {
  events: AgentEvent[]
  runs: AgentRun[]
}

async function loadArena() {
  return apiFetch<ArenaPayload>('/public/arena')
}

export function subscribeToArena(
  onData: (payload: { events: AgentEvent[]; runs: AgentRun[] }) => void,
  onError: (err: Error) => void,
) {
  let cancelled = false
  let consecutiveErrors = 0
  let interval: ReturnType<typeof setInterval> | null = null

  const stopPolling = () => {
    if (interval !== null) {
      window.clearInterval(interval)
      interval = null
    }
  }

  const load = async () => {
    try {
      const data = await loadArena()
      if (!cancelled) {
        consecutiveErrors = 0
        onData(data)
      }
    } catch (err) {
      if (!cancelled) {
        consecutiveErrors++
        const message = err instanceof Error ? err.message : String(err)
        // Stop polling on auth errors — repeated 401s are pointless
        if (message.includes('401') || message.includes('Unauthorized')) {
          stopPolling()
        }
        // Also stop after 5 consecutive errors of any kind
        if (consecutiveErrors >= 5) {
          stopPolling()
        }
        onError(err instanceof Error ? err : new Error(message))
      }
    }
  }

  void load()
  interval = window.setInterval(() => void load(), 30000)

  return () => {
    cancelled = true
    stopPolling()
  }
}

/** @deprecated Use subscribeToArena instead */
export function subscribeToEvents(
  cb: (events: AgentEvent[]) => void,
  _maxItems = 100, // eslint-disable-line @typescript-eslint/no-unused-vars
) {
  return subscribeToArena(({ events }) => cb(events), () => {})
}

/** @deprecated Use subscribeToArena instead */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function subscribeToRuns(cb: (runs: AgentRun[]) => void, _maxItems = 50) {
  return subscribeToArena(({ runs }) => cb(runs), () => {})
}

export function formatRelative(ts: string | { toDate(): Date } | null): string {
  if (!ts) return '–'
  const date = typeof ts === 'string' ? new Date(ts) : ts.toDate()
  const diff = Date.now() - date.getTime()
  if (diff < 60000) return 'gerade eben'
  if (diff < 3600000) return `vor ${Math.floor(diff / 60000)} Min`
  if (diff < 86400000) return `vor ${Math.floor(diff / 3600000)} Std`
  return date.toLocaleDateString('de-DE')
}

export function durationSec(start: string | { toDate(): Date } | null, end: string | { toDate(): Date } | null): string {
  if (!start || !end) return '…'
  const startMs = typeof start === 'string' ? new Date(start).getTime() : start.toDate().getTime()
  const endMs = typeof end === 'string' ? new Date(end).getTime() : end.toDate().getTime()
  const s = Math.round((endMs - startMs) / 1000)
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
}
