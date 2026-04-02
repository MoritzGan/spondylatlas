import { useEffect, useRef, useState } from 'react'

import {
  subscribeToEvents,
  subscribeToRuns,
  formatRelative,
  durationSec,
  AGENT_META,
  type AgentEvent,
  type AgentRun,
} from '../lib/agentArena'

// ── Helpers ──────────────────────────────────────────────────────────────────

const EVENT_ICON: Record<string, string> = {
  start: '',
  step: '',
  complete: '',
  error: '',
  skip: '',
}

const EVENT_COLOR: Record<string, string> = {
  start: 'text-blue-600 bg-blue-50 border-blue-200',
  step: 'text-gray-700 bg-white border-gray-100',
  complete: 'text-green-700 bg-green-50 border-green-200',
  error: 'text-red-700 bg-red-50 border-red-200',
  skip: 'text-gray-400 bg-gray-50 border-gray-100',
}

const STATUS_BADGE: Record<string, string> = {
  running: 'bg-blue-100 text-blue-700',
  complete: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
}

const STATUS_LABEL: Record<string, string> = {
  running: 'Läuft',
  complete: 'Fertig',
  error: 'Fehler',
}

// ── Agent Status Card ─────────────────────────────────────────────────────────

function AgentCard({ runs }: { runs: AgentRun[] }) {
  const lastRun = runs[0]
  if (!lastRun) return null
  const meta = AGENT_META[lastRun.agent] ?? { label: lastRun.agent, emoji: '', color: 'gray' }
  const runningCount = runs.filter((r) => r.status === 'running').length

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{meta.emoji}</span>
          <span className="font-medium text-gray-900 text-sm">{meta.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {runningCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-blue-600">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500" />
              Aktiv
            </span>
          )}
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[lastRun.status]}`}>
            {STATUS_LABEL[lastRun.status]}
          </span>
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-500 line-clamp-2">{lastRun.summary}</p>
      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
        <span>{formatRelative(lastRun.startedAt)}</span>
        <span>
          {lastRun.itemsProcessed > 0 && `${lastRun.itemsProcessed} Elemente · `}
          {durationSec(lastRun.startedAt, lastRun.completedAt)}
        </span>
      </div>
    </div>
  )
}

// ── Live Feed Item ────────────────────────────────────────────────────────────

function FeedItem({ event, isNew }: { event: AgentEvent; isNew: boolean }) {
  const meta = AGENT_META[event.agent] ?? { label: event.agent, emoji: '' }
  return (
    <div
      className={`flex gap-3 rounded-lg border p-3 text-sm transition-all duration-500 ${
        EVENT_COLOR[event.type] ?? 'bg-white border-gray-100'
      } ${isNew ? 'ring-1 ring-amber-300' : ''}`}
    >
      <span className="shrink-0 text-base leading-5">{EVENT_ICON[event.type] ?? '·'}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium opacity-60">{meta.emoji} {meta.label}</span>
          <span className="ml-auto shrink-0 text-xs opacity-40">
            {formatRelative(event.timestamp)}
          </span>
        </div>
        <p className="mt-0.5 font-medium leading-snug">{event.message}</p>
        {event.detail && (
          <p className="mt-0.5 text-xs opacity-60 line-clamp-2">{event.detail}</p>
        )}
      </div>
    </div>
  )
}

// ── Run History Row ───────────────────────────────────────────────────────────

function RunRow({ run }: { run: AgentRun }) {
  const meta = AGENT_META[run.agent] ?? { label: run.agent, emoji: '' }
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-2 pr-4 text-sm">
        <span className="mr-1">{meta.emoji}</span>
        <span className="font-medium">{meta.label}</span>
      </td>
      <td className="py-2 pr-4">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[run.status]}`}>
          {STATUS_LABEL[run.status]}
        </span>
      </td>
      <td className="py-2 pr-4 text-xs text-gray-500 max-w-xs truncate">{run.summary}</td>
      <td className="py-2 pr-4 text-xs text-gray-400 whitespace-nowrap">
        {run.itemsProcessed > 0 ? `${run.itemsProcessed} Elemente` : '–'}
      </td>
      <td className="py-2 text-xs text-gray-400 whitespace-nowrap">
        {formatRelative(run.startedAt)} · {durationSec(run.startedAt, run.completedAt)}
      </td>
    </tr>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AgentArena() {

  const [events, setEvents] = useState<AgentEvent[]>([])
  const [runs, setRuns] = useState<AgentRun[]>([])
  const [newIds, setNewIds] = useState<Set<string>>(new Set())
  const [autoScroll, setAutoScroll] = useState(true)
  const feedRef = useRef<HTMLDivElement>(null)
  const prevIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    const unsub1 = subscribeToEvents((ev) => {
      const incoming = new Set(ev.map((e) => e.id))
      const fresh = ev.filter((e) => !prevIds.current.has(e.id)).map((e) => e.id)
      if (fresh.length) {
        setNewIds(new Set(fresh))
        setTimeout(() => setNewIds(new Set()), 2000)
      }
      prevIds.current = incoming
      setEvents(ev)
    })
    const unsub2 = subscribeToRuns(setRuns)
    return () => { unsub1(); unsub2() }
  }, [])

  useEffect(() => {
    if (autoScroll && feedRef.current) {
      feedRef.current.scrollTop = 0
    }
  }, [events, autoScroll])

  // Group runs by agent for status cards
  const runsByAgent = runs.reduce<Record<string, AgentRun[]>>((acc, r) => {
    ;(acc[r.agent] = acc[r.agent] ?? []).push(r)
    return acc
  }, {})

  const totalItems = runs.filter(r => r.status === 'complete').reduce((s, r) => s + r.itemsProcessed, 0)
  const activeAgents = Object.values(runsByAgent).filter(rs => rs[0]?.status === 'running').length

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">⚙️ Agent Arena</h1>
          <p className="mt-1 text-gray-500 text-sm">
            Echtzeit-Einblick in die KI-Pipeline — was unsere Agenten gerade tun
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">{totalItems}</div>
            <div className="text-xs text-gray-500">Elemente verarbeitet</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{runs.length}</div>
            <div className="text-xs text-gray-500">Runs gesamt</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${activeAgents > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              {activeAgents > 0 ? '●' : '○'} {activeAgents}
            </div>
            <div className="text-xs text-gray-500">Aktive Agents</div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Live Feed */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />
              Live Feed
            </h2>
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={e => setAutoScroll(e.target.checked)}
                className="rounded"
              />
              Auto-Scroll
            </label>
          </div>
          <div
            ref={feedRef}
            className="h-[560px] overflow-y-auto space-y-2 pr-1"
          >
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                <span className="text-4xl mb-3"></span>
                <p>Noch keine Events — Agenten starten bald.</p>
              </div>
            ) : (
              events.map((ev) => (
                <FeedItem key={ev.id} event={ev} isNew={newIds.has(ev.id)} />
              ))
            )}
          </div>
        </div>

        {/* Agent Status Cards */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Agent Status</h2>
          <div className="space-y-3">
            {Object.entries(AGENT_META).map(([agentName]) => (
              runsByAgent[agentName] ? (
                <AgentCard key={agentName} runs={runsByAgent[agentName]} />
              ) : (
                <div key={agentName} className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-400">
                  <span className="mr-2">{AGENT_META[agentName].emoji}</span>
                  {AGENT_META[agentName].label}
                  <span className="ml-2 text-xs">– noch kein Run</span>
                </div>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Run History */}
      <div className="mt-10">
        <h2 className="font-semibold text-gray-900 mb-3">Run-Historie</h2>
        {runs.length === 0 ? (
          <p className="text-gray-400 text-sm">Noch keine abgeschlossenen Runs.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Ergebnis</th>
                  <th className="px-4 py-3">Elemente</th>
                  <th className="px-4 py-3">Zeit</th>
                </tr>
              </thead>
              <tbody className="px-4">
                {runs.map((run) => (
                  <RunRow key={run.id} run={run} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
