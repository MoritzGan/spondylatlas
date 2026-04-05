import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getPublishedMetaStudies, formatDate, type MetaStudy } from '../lib/metaStudies'
import { localizeField } from '../lib/i18nField'
import { CardListSkeleton } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'

function MetaStudyCard({ study }: { study: MetaStudy }) {
  const { t } = useTranslation()
  return (
    <Link
      to={`/meta-studien/${study.id}`}
      className="block rounded-xl border border-stone-200 bg-white p-6 transition-shadow hover:shadow-md"
    >
      <h2 className="text-base font-semibold text-stone-900 leading-snug">{localizeField(study.title)}</h2>
      <p className="mt-2 text-sm text-stone-600 line-clamp-3">
        {localizeField(study.sections.abstract).slice(0, 200)}…
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-stone-400">
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-800 font-medium">
          {t('meta_studies.word_count', { count: study.wordCount })}
        </span>
        <span>{formatDate(study.publishedAt)}</span>
        {study.references.length > 0 && (
          <span>{study.references.length} {t('meta_studies.references')}</span>
        )}
      </div>
    </Link>
  )
}

export default function MetaStudies() {
  const { t } = useTranslation()
  const [studies, setStudies] = useState<MetaStudy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    getPublishedMetaStudies()
      .then(setStudies)
      .catch((err) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-stone-900">{t('meta_studies.title')}</h1>
        <p className="mt-2 text-stone-600">{t('meta_studies.subtitle')}</p>
      </div>

      {loading && <div className="mt-8"><CardListSkeleton count={3} /></div>}

      {!loading && error && (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          <p className="font-semibold">{t('meta_studies.error_title')}</p>
          <p className="mt-1 text-red-600">{t('meta_studies.error_text')}</p>
        </div>
      )}

      {!loading && !error && studies.length === 0 && (
        <div className="mt-8">
          <EmptyState
            icon=""
            title={t('meta_studies.empty_title')}
            description={t('meta_studies.empty_text')}
          />
        </div>
      )}

      {studies.length > 0 && (
        <div className="mt-8 space-y-4">
          {studies.map((s) => <MetaStudyCard key={s.id} study={s} />)}
        </div>
      )}
    </div>
  )
}
