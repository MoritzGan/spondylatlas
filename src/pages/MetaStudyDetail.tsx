import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getMetaStudy, formatDate, type MetaStudyDetail as MetaStudyDetailType, type ReviewRound } from '../lib/metaStudies'
import { DetailSkeleton } from '../components/Skeleton'

const SECTION_KEYS = ['abstract', 'introduction', 'methods', 'results', 'discussion', 'conclusion'] as const

const VERDICT_CONFIG: Record<string, { color: string; labelKey: string }> = {
  approved: { color: 'bg-emerald-100 text-emerald-800', labelKey: 'meta_studies.verdict_approved' },
  revision_needed: { color: 'bg-amber-100 text-amber-800', labelKey: 'meta_studies.verdict_revision_needed' },
  major_issues: { color: 'bg-red-100 text-red-800', labelKey: 'meta_studies.verdict_major_issues' },
}

function ReviewCard({ review }: { review: ReviewRound }) {
  const { t } = useTranslation()
  const cfg = VERDICT_CONFIG[review.verdict]
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-stone-700">
          {t('meta_studies.review_round', { round: review.round })}
        </span>
        {cfg && (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
            {t(cfg.labelKey)}
          </span>
        )}
      </div>

      {review.strengths.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-emerald-700 mb-1">{t('meta_studies.strengths')}</p>
          <ul className="list-disc list-inside text-xs text-stone-600 space-y-0.5">
            {review.strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}

      {review.weaknesses.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-red-700 mb-1">{t('meta_studies.weaknesses')}</p>
          <ul className="list-disc list-inside text-xs text-stone-600 space-y-0.5">
            {review.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {review.suggestions.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-blue-700 mb-1">{t('meta_studies.suggestions')}</p>
          <ul className="list-disc list-inside text-xs text-stone-600 space-y-0.5">
            {review.suggestions.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded-md bg-white p-2 text-xs">
          <p className="font-semibold text-stone-500 mb-0.5">{t('meta_studies.methodology')}</p>
          <p className="text-stone-600">{review.methodologyCritique}</p>
        </div>
        <div className="rounded-md bg-white p-2 text-xs">
          <p className="font-semibold text-stone-500 mb-0.5">{t('meta_studies.statistics')}</p>
          <p className="text-stone-600">{review.statisticalCritique}</p>
        </div>
        <div className="rounded-md bg-white p-2 text-xs">
          <p className="font-semibold text-stone-500 mb-0.5">{t('meta_studies.citations')}</p>
          <p className="text-stone-600">{review.citationCheck}</p>
        </div>
      </div>
    </div>
  )
}

export default function MetaStudyDetail() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const [study, setStudy] = useState<MetaStudyDetailType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getMetaStudy(id).then((s) => {
      setStudy(s)
      setLoading(false)
    })
  }, [id])

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-10"><DetailSkeleton /></div>
  if (!study) return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-stone-500">{t('meta_studies.not_found')}</p>
      <Link to="/meta-studien" className="mt-3 inline-block text-primary-600 hover:underline">
        ← {t('meta_studies.back')}
      </Link>
    </div>
  )

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/meta-studien" className="text-sm text-primary-600 hover:underline">
        ← {t('meta_studies.back')}
      </Link>

      {/* Disclaimer banner */}
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        {t('meta_studies.disclaimer')}
      </div>

      {/* Main card */}
      <article className="mt-4 rounded-xl border border-stone-200 bg-white p-7">
        <h1 className="text-2xl font-bold text-stone-900 leading-snug">{study.title}</h1>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-stone-400">
          <span>{t('meta_studies.published_at', { date: formatDate(study.publishedAt) })}</span>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-800 font-medium">
            {t('meta_studies.word_count', { count: study.wordCount })}
          </span>
        </div>

        {study.hypothesisTitle && (
          <div className="mt-3 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-700">
            <span className="font-medium">{t('meta_studies.based_on_hypothesis')}: </span>
            {study.hypothesisId ? (
              <Link to={`/hypotheses/${study.hypothesisId}`} className="underline hover:text-blue-900">
                {study.hypothesisTitle}
              </Link>
            ) : (
              study.hypothesisTitle
            )}
          </div>
        )}

        {/* Paper sections */}
        {SECTION_KEYS.map((key) => {
          const content = study.sections[key]
          if (!content) return null
          return (
            <section key={key} className="mt-6">
              <h2 className="text-lg font-semibold text-stone-800 mb-2">
                {t(`meta_studies.${key}`)}
              </h2>
              <div className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                {content}
              </div>
            </section>
          )
        })}
      </article>

      {/* References */}
      {study.references.length > 0 && (
        <section className="mt-6 rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-stone-800 mb-3">{t('meta_studies.references')}</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-stone-600">
            {study.references.map((ref, i) => (
              <li key={i}>
                {ref.authors}. {ref.title}. {ref.source}.
                {ref.doi && (
                  <span className="ml-1 text-xs text-stone-400">DOI: {ref.doi}</span>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Review history */}
      {study.reviews.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold text-stone-800 mb-3">{t('meta_studies.review_history')}</h2>
          <div className="space-y-3">
            {study.reviews.map((review) => (
              <ReviewCard key={review.round} review={review} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
