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

export function subscribeToEvents(
  cb: (events: AgentEvent[]) => void,
  _maxItems = 100, // eslint-disable-line @typescript-eslint/no-unused-vars
) {
  let cancelled = false

  const load = async () => {
    const { events } = await loadArena()
    if (!cancelled) {
      cb(events)
    }
  }

  void load()
  const interval = window.setInterval(() => void load(), 30000)

  return () => {
    cancelled = true
    window.clearInterval(interval)
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function subscribeToRuns(cb: (runs: AgentRun[]) => void, _maxItems = 50) {
  let cancelled = false

  const load = async () => {
    const { runs } = await loadArena()
    if (!cancelled) {
      cb(runs)
    }
  }

  void load()
  const interval = window.setInterval(() => void load(), 30000)

  return () => {
    cancelled = true
    window.clearInterval(interval)
  }
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

export function durationSec(start: string | null, end: string | null): string {
  if (!start || !end) return '…'
  const s = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000)
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
}
