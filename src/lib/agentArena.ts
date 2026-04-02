import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,

  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export type EventType = 'start' | 'step' | 'complete' | 'error' | 'skip'
export type AgentName =
  | 'paper-search'
  | 'evidence-grader'
  | 'summary-writer'
  | 'trial-tracker'
  | 'forum-moderator'

export interface AgentEvent {
  id: string
  agent: AgentName
  runId: string
  type: EventType
  message: string
  detail: string | null
  timestamp: Timestamp
}

export interface AgentRun {
  id: string
  agent: AgentName
  runId: string
  status: 'running' | 'complete' | 'error'
  startedAt: Timestamp
  completedAt: Timestamp | null
  itemsProcessed: number
  summary: string
}

export const AGENT_META: Record<string, { label: string; emoji: string; color: string }> = {
  'paper-search':   { label: 'Paper Search',    emoji: '🔍', color: 'blue'   },
  'evidence-grader':{ label: 'Evidence Grader', emoji: '📊', color: 'purple' },
  'summary-writer': { label: 'Summary Writer',  emoji: '✍️',  color: 'green'  },
  'trial-tracker':  { label: 'Trial Tracker',   emoji: '🧪', color: 'orange' },
  'forum-moderator':    { label: 'Forum Moderator',      emoji: '🛡️',  color: 'red'    },
  'hypothesis-generator': { label: 'Hypothesis Generator', emoji: '💡', color: 'yellow' },
  'hypothesis-critic':    { label: 'Hypothesis Critic',    emoji: '🔬', color: 'indigo' },
}

export function subscribeToEvents(
  cb: (events: AgentEvent[]) => void,
  maxItems = 100
) {
  const q = query(
    collection(db, 'agent_events'),
    orderBy('timestamp', 'desc'),
    limit(maxItems)
  )
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AgentEvent)))
  })
}

export function subscribeToRuns(cb: (runs: AgentRun[]) => void, maxItems = 50) {
  const q = query(
    collection(db, 'agent_runs'),
    orderBy('startedAt', 'desc'),
    limit(maxItems)
  )
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AgentRun)))
  })
}

export function formatRelative(ts: Timestamp | null): string {
  if (!ts) return '–'
  const diff = Date.now() - ts.toDate().getTime()
  if (diff < 60000) return 'gerade eben'
  if (diff < 3600000) return `vor ${Math.floor(diff / 60000)} Min`
  if (diff < 86400000) return `vor ${Math.floor(diff / 3600000)} Std`
  return ts.toDate().toLocaleDateString('de-DE')
}

export function durationSec(start: Timestamp, end: Timestamp | null): string {
  if (!end) return '…'
  const s = Math.round((end.toDate().getTime() - start.toDate().getTime()) / 1000)
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
}
