import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getTrial } from '../lib/trials'
import type { Trial } from '../types/trials'
import { usePageMeta } from '../hooks/usePageMeta'
import { DetailSkeleton } from '../components/Skeleton'

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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export default function TrialDetail() {
  const { nctId } = useParams<{ nctId: string }>()
  const { t, i18n } = useTranslation()
  const [trial, setTrial] = useState<Trial | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  usePageMeta({
    title: trial ? `${trial.title} | SpondylAtlas` : `${t('trials.title')} | SpondylAtlas`,
    description: i18n.language.startsWith('de')
      ? 'Detailansicht einer klinischen Studie zu Morbus Bechterew.'
      : 'Detail view of a clinical trial for Ankylosing Spondylitis.',
  })

  useEffect(() => {
    if (!nctId) return
    const fetch = async () => {
      try {
        setTrial(await getTrial(nctId))
      } catch (err) {
        console.error('Failed to fetch trial:', err)
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    void fetch()
  }, [nctId])

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <DetailSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link to="/trials" className="text-sm text-primary-600 hover:underline">
          &larr; {t('trials.back_to_trials')}
        </Link>
        <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {t('common.error')}: {error}
        </div>
      </div>
    )
  }

  if (!trial) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link to="/trials" className="text-sm text-primary-600 hover:underline">
          &larr; {t('trials.back_to_trials')}
        </Link>
        <div className="mt-6 text-center text-stone-500">{t('trials.not_found')}</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/trials" className="text-sm text-primary-600 hover:underline">
        &larr; {t('trials.back_to_trials')}
      </Link>

      <article className="mt-6 rounded-xl border border-stone-200 bg-white p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-stone-900">{trial.title}</h1>
          <div className="flex shrink-0 gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(trial.status)}`}>
              {t(`trials.status_${trial.status.toLowerCase()}`)}
            </span>
            <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800">
              {phaseLabel(trial.phase)}
            </span>
          </div>
        </div>

        <p className="mt-1 text-sm text-stone-400">{trial.nctId}</p>

        {/* Summary */}
        <section className="mt-6">
          <h2 className="text-lg font-semibold text-stone-900">{t('trials.summary')}</h2>
          <p className="mt-2 whitespace-pre-line text-stone-700">{trial.summaryDe}</p>
        </section>

        {/* Interventions */}
        {trial.interventions.length > 0 && (
          <section className="mt-6">
            <h2 className="text-lg font-semibold text-stone-900">{t('trials.interventions')}</h2>
            <ul className="mt-2 list-inside list-disc text-stone-700">
              {trial.interventions.map(intervention => (
                <li key={intervention}>{intervention}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Locations */}
        {trial.locations.length > 0 && (
          <section className="mt-6">
            <h2 className="text-lg font-semibold text-stone-900">{t('trials.locations')}</h2>
            <ul className="mt-2 list-inside list-disc text-stone-700">
              {trial.locations.map(location => (
                <li key={location}>{location}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Meta info */}
        <section className="mt-6 grid grid-cols-2 gap-4 rounded-lg bg-stone-50 p-4 text-sm sm:grid-cols-3">
          {trial.enrollmentCount && (
            <div>
              <span className="font-medium text-stone-700">{t('trials.enrollment')}</span>
              <p className="text-stone-600">{trial.enrollmentCount}</p>
            </div>
          )}
          <div>
            <span className="font-medium text-stone-700">{t('trials.start_date')}</span>
            <p className="text-stone-600">{formatDate(trial.startDate)}</p>
          </div>
          <div>
            <span className="font-medium text-stone-700">{t('trials.completion_date')}</span>
            <p className="text-stone-600">{formatDate(trial.completionDate)}</p>
          </div>
        </section>

        {/* CTA */}
        <div className="mt-8 border-t border-stone-100 pt-6">
          <a
            href={trial.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            {t('trials.view_on_ctgov')}
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
          </a>
        </div>
      </article>
    </div>
  )
}
