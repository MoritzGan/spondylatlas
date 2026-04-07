import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  sanitizeErrorDetail,
  subscribeToArena,
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
  step: 'text-stone-700 bg-white border-stone-100',
  complete: 'text-green-700 bg-green-50 border-green-200',
  error: 'text-red-700 bg-red-50 border-red-200',
  skip: 'text-stone-400 bg-stone-50 border-stone-100',
}



/** Group consecutive identical error events from the same agent into one with a count badge */
function groupConsecutiveErrors(events: AgentEvent[]): (AgentEvent & { repeatCount?: number })[] {
  const result: (AgentEvent & { repeatCount?: number })[] = [];
  for (const ev of events) {
    const prev = result[result.length - 1];
    if (
      prev &&
      ev.type === 'error' &&
      prev.type === 'error' &&
      ev.agent === prev.agent &&
      ev.message === prev.message
    ) {
      prev.repeatCount = (prev.repeatCount ?? 1) + 1;
    } else {
      result.push({ ...ev });
    }
  }
  return result;
}

const STATUS_BADGE: Record<string, string> = {
  running: 'bg-blue-100 text-blue-700',
  complete: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
}

const STATUS_LABEL_KEY: Record<string, string> = {
  running: 'arena.status_running',
  complete: 'arena.status_complete',
  error: 'arena.status_error',
}

// ── Agent Status Card ─────────────────────────────────────────────────────────

function AgentCard({ runs }: { runs: AgentRun[] }) {
  const { t, i18n } = useTranslation()
  const lastRun = runs[0]
  if (!lastRun) return null
  const meta = AGENT_META[lastRun.agent] ?? { label: lastRun.agent, emoji: '', color: 'gray' }
  const runningCount = runs.filter((r) => r.status === 'running').length

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{meta.emoji}</span>
          <span className="font-medium text-stone-900 text-sm">{meta.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {runningCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-blue-600">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500" />
              {t('arena.active')}
            </span>
          )}
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[lastRun.status]}`}>
            {t(STATUS_LABEL_KEY[lastRun.status])}
          </span>
        </div>
      </div>
      <p className="mt-2 text-xs text-stone-500 line-clamp-2">{lastRun.status === 'error' ? (sanitizeErrorDetail(lastRun.summary, t('arena.error_unavailable')) ?? lastRun.summary) : lastRun.summary}</p>
      <div className="mt-2 flex items-center justify-between text-xs text-stone-400">
        <span>{formatRelative(lastRun.startedAt, i18n.language)}</span>
        <span>
          {lastRun.itemsProcessed > 0 && `${lastRun.itemsProcessed} ${t('arena.items')} · `}
          {durationSec(lastRun.startedAt, lastRun.completedAt)}
        </span>
      </div>
    </div>
  )
}

// ── Live Feed Item ────────────────────────────────────────────────────────────

function FeedItem({ event, isNew }: { event: AgentEvent & { repeatCount?: number }; isNew: boolean }) {
  const { t, i18n } = useTranslation()
  const meta = AGENT_META[event.agent] ?? { label: event.agent, emoji: '' }
  const detail = event.type === 'error'
    ? sanitizeErrorDetail(event.detail, t('arena.error_unavailable'))
    : event.detail ?? null
  const message = event.type === 'error'
    ? (sanitizeErrorDetail(event.message, t('arena.error_unavailable')) ?? event.message)
    : event.message
  return (
    <div
      className={`flex gap-3 rounded-lg border p-3 text-sm transition-all duration-500 ${
        EVENT_COLOR[event.type] ?? 'bg-white border-stone-100'
      } ${isNew ? 'ring-1 ring-amber-300' : ''}`}
    >
      <span className="shrink-0 text-base leading-5">{EVENT_ICON[event.type] ?? '·'}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium opacity-60">{meta.emoji} {meta.label}</span>
          <span className="ml-auto shrink-0 text-xs opacity-40">
            {formatRelative(event.timestamp, i18n.language)}
          </span>
        </div>
        <p className="mt-0.5 font-medium leading-snug">{message}</p>
        {detail && (
          <p className="mt-0.5 text-xs opacity-60 line-clamp-2">{detail}</p>
        )}
      </div>
    </div>
  )
}

// ── Run History Row (desktop table) ──────────────────────────────────────────

function RunRow({ run }: { run: AgentRun }) {
  const { t, i18n } = useTranslation()
  const meta = AGENT_META[run.agent] ?? { label: run.agent, emoji: '' }
  return (
    <tr className="border-b border-stone-100 hover:bg-stone-50">
      <td className="py-2 pr-4 text-sm">
        <span className="mr-1">{meta.emoji}</span>
        <span className="font-medium">{meta.label}</span>
      </td>
      <td className="py-2 pr-4">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[run.status]}`}>
          {t(STATUS_LABEL_KEY[run.status])}
        </span>
      </td>
      <td className="py-2 pr-4 text-xs text-stone-500 max-w-xs truncate">{run.status === 'error' ? (sanitizeErrorDetail(run.summary, t('arena.error_unavailable')) ?? run.summary) : run.summary}</td>
      <td className="py-2 pr-4 text-xs text-stone-400 whitespace-nowrap">
        {run.itemsProcessed > 0 ? `${run.itemsProcessed} ${t('arena.items')}` : '–'}
      </td>
      <td className="py-2 text-xs text-stone-400 whitespace-nowrap">
        {formatRelative(run.startedAt, i18n.language)} · {durationSec(run.startedAt, run.completedAt)}
      </td>
    </tr>
  )
}

// ── Run History Card (mobile) ────────────────────────────────────────────────

function RunCard({ run }: { run: AgentRun }) {
  const { t, i18n } = useTranslation()
  const meta = AGENT_META[run.agent] ?? { label: run.agent, emoji: '' }
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{meta.emoji} {meta.label}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[run.status]}`}>
          {t(STATUS_LABEL_KEY[run.status])}
        </span>
      </div>
      {run.summary && <p className="mt-2 text-xs text-stone-500 line-clamp-2">{run.status === 'error' ? (sanitizeErrorDetail(run.summary, t('arena.error_unavailable')) ?? run.summary) : run.summary}</p>}
      <div className="mt-2 flex items-center justify-between text-xs text-stone-400">
        <span>{run.itemsProcessed > 0 ? `${run.itemsProcessed} ${t('arena.items')}` : '–'}</span>
        <span>{formatRelative(run.startedAt, i18n.language)} · {durationSec(run.startedAt, run.completedAt)}</span>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AgentArena() {
  const { t } = useTranslation()

  const [events, setEvents] = useState<AgentEvent[]>([])
  const [runs, setRuns] = useState<AgentRun[]>([])
  const [error, setError] = useState<Error | null>(null)
  const [newIds, setNewIds] = useState<Set<string>>(new Set())
  const [autoScroll, setAutoScroll] = useState(true)
  const feedRef = useRef<HTMLDivElement>(null)
  const prevIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    const unsub = subscribeToArena(
      ({ events: ev, runs: r }) => {
        setError(null)

        const incoming = new Set(ev.map((e) => e.id))
        const fresh = ev.filter((e) => !prevIds.current.has(e.id)).map((e) => e.id)
        if (fresh.length) {
          setNewIds(new Set(fresh))
          setTimeout(() => setNewIds(new Set()), 2000)
        }
        prevIds.current = incoming
        setEvents(ev)
        setRuns(r)
      },
      (err) => {
        setError(err)
      },
    )
    return unsub
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

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-bold text-stone-900">⚙️ {t('arena.title')}</h1>
        <p className="mt-1 text-stone-500 text-sm">{t('arena.subtitle')}</p>
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          <p className="font-semibold">{t('arena.error_title')}</p>
          <p className="mt-1 text-amber-600">{t('arena.error_text')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-stone-900">⚙️ {t('arena.title')}</h1>
        <p className="mt-1 text-stone-500 text-sm">
          {t('arena.subtitle')}
        </p>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-lg border border-stone-200 bg-white p-3 text-center">
          <div className="text-2xl font-bold text-amber-600">{totalItems}</div>
          <div className="text-xs text-stone-500">{t('arena.items_processed')}</div>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{runs.length}</div>
          <div className="text-xs text-stone-500">{t('arena.total_runs')}</div>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-3 text-center">
          <div className={`text-2xl font-bold ${activeAgents > 0 ? 'text-green-600' : 'text-stone-400'}`}>
            {activeAgents > 0 ? '●' : '○'} {activeAgents}
          </div>
          <div className="text-xs text-stone-500">{t('arena.active_agents')}</div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Live Feed */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-stone-900 flex items-center gap-2">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />
              {t('arena.live_feed')}
            </h2>
            <label className="flex items-center gap-2 text-xs text-stone-500 cursor-pointer">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={e => setAutoScroll(e.target.checked)}
                className="rounded"
              />
              {t('arena.auto_scroll')}
            </label>
          </div>
          <div
            ref={feedRef}
            className="h-[560px] overflow-y-auto space-y-2 pr-1"
          >
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-stone-400 text-sm">
                <span className="text-4xl mb-3"></span>
                <p>{t('arena.no_events')}</p>
              </div>
            ) : (
              groupConsecutiveErrors(events).map((ev) => (
                <FeedItem key={ev.id} event={ev} isNew={newIds.has(ev.id)} />
              ))
            )}
          </div>
        </div>

        {/* Agent Status Cards */}
        <div>
          <h2 className="font-semibold text-stone-900 mb-3">{t('arena.agent_status')}</h2>
          <div className="space-y-3">
            {Object.entries(AGENT_META).map(([agentName]) => (
              runsByAgent[agentName] ? (
                <AgentCard key={agentName} runs={runsByAgent[agentName]} />
              ) : (
                <div key={agentName} className="rounded-xl border border-dashed border-stone-200 p-4 text-sm text-stone-400">
                  <span className="mr-2">{AGENT_META[agentName].emoji}</span>
                  {AGENT_META[agentName].label}
                  <span className="ml-2 text-xs">– {t('arena.no_run_yet')}</span>
                </div>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Run History */}
      <div className="mt-10">
        <h2 className="font-semibold text-stone-900 mb-3">{t('arena.run_history')}</h2>
        {runs.length === 0 ? (
          <p className="text-stone-400 text-sm">{t('arena.no_runs')}</p>
        ) : (
          <>
            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-stone-200 bg-white">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50 text-xs font-medium text-stone-500 uppercase tracking-wide">
                    <th className="px-4 py-3">{t('arena.table_agent')}</th>
                    <th className="px-4 py-3">{t('arena.table_status')}</th>
                    <th className="px-4 py-3">{t('arena.table_result')}</th>
                    <th className="px-4 py-3">{t('arena.table_items')}</th>
                    <th className="px-4 py-3">{t('arena.table_time')}</th>
                  </tr>
                </thead>
                <tbody className="px-4">
                  {runs.map((run) => (
                    <RunRow key={run.id} run={run} />
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile: cards */}
            <div className="md:hidden space-y-3">
              {runs.map((run) => (
                <RunCard key={run.id} run={run} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
