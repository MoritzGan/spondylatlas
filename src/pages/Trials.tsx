import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getTrials } from '../lib/trials'
import type { Trial } from '../types/trials'
import { usePageMeta } from '../hooks/usePageMeta'
import { CardListSkeleton } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'

const PHASE_OPTIONS = ['PHASE1', 'PHASE2', 'PHASE3', 'PHASE4'] as const

function phaseLabel(phase: string): string {
  const map: Record<string, string> = {
    PHASE1: 'Phase I',
    PHASE2: 'Phase II',
    PHASE3: 'Phase III',
    PHASE4: 'Phase IV',
    'N/A': 'N/A',
  }
  return map[phase] || phase
}

function statusColor(status: string): string {
  if (status === 'RECRUITING') return 'bg-green-100 text-green-800'
  if (status === 'ENROLLING_BY_INVITATION') return 'bg-amber-100 text-amber-800'
  return 'bg-stone-100 text-stone-700'
}

export default function Trials() {
  const { t, i18n } = useTranslation()
  const [trials, setTrials] = useState<Trial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [phaseFilter, setPhaseFilter] = useState<string | null>(null)

  usePageMeta({
    title: `${t('trials.title')} | SpondylAtlas`,
    description: i18n.language.startsWith('de')
      ? 'Aktuelle klinische Studien zu Morbus Bechterew / axialer Spondyloarthritis.'
      : 'Current clinical trials for Ankylosing Spondylitis / axial Spondyloarthritis.',
  })

  useEffect(() => {
    const fetch = async () => {
      try {
        setTrials(await getTrials())
      } catch (err) {
        console.error('Failed to fetch trials:', err)
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    void fetch()
  }, [])

  const filtered = useMemo(() => {
    let result = trials

    if (phaseFilter) {
      result = result.filter(t => t.phase === phaseFilter)
    }

    if (search.trim()) {
      const term = search.toLowerCase()
      result = result.filter(
        t =>
          t.title.toLowerCase().includes(term) ||
          t.interventions.some(i => i.toLowerCase().includes(term)) ||
          t.locations.some(l => l.toLowerCase().includes(term)),
      )
    }

    return result
  }, [trials, search, phaseFilter])

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-stone-900">{t('trials.title')}</h1>
      <p className="mt-2 text-stone-600">{t('trials.subtitle')}</p>

      {/* Search */}
      <div className="mt-6">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('trials.search_placeholder')}
          className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 placeholder-stone-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
      </div>

      {/* Phase filter chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setPhaseFilter(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            phaseFilter === null
              ? 'bg-primary-600 text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          {t('trials.all_phases')}
        </button>
        {PHASE_OPTIONS.map(phase => (
          <button
            key={phase}
            onClick={() => setPhaseFilter(phaseFilter === phase ? null : phase)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              phaseFilter === phase
                ? 'bg-primary-600 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {phaseLabel(phase)}
          </button>
        ))}
      </div>

      {loading && (
        <div className="mt-8"><CardListSkeleton count={4} /></div>
      )}

      {error && (
        <div className="mt-8 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {t('common.error')}: {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="mt-8">
          <EmptyState
            icon=""
            title={search.trim() || phaseFilter ? t('trials.no_results') : t('trials.no_trials')}
          />
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          <p className="mt-4 text-sm text-stone-500">
            {t('trials.trial_count', { count: filtered.length })}
          </p>

          <div className="mt-4 space-y-4">
            {filtered.map(trial => (
              <Link
                key={trial.nctId}
                to={`/trials/${trial.nctId}`}
                className="block rounded-xl border border-stone-200 bg-white p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-semibold text-stone-900">{trial.title}</h2>
                  <div className="flex shrink-0 gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(trial.status)}`}>
                      {t(`trials.status_${trial.status.toLowerCase()}`)}
                    </span>
                    <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800">
                      {phaseLabel(trial.phase)}
                    </span>
                  </div>
                </div>

                <p className="mt-2 line-clamp-2 text-stone-600">{trial.summaryDe}</p>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
                  {trial.locations.length > 0 && (
                    <span>{trial.locations.slice(0, 3).join(' / ')}</span>
                  )}
                  {trial.enrollmentCount && (
                    <span>{t('trials.enrollment')}: {trial.enrollmentCount}</span>
                  )}
                  {trial.interventions.length > 0 && (
                    <span>{trial.interventions.join(', ')}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
