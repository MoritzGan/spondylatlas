import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { subscribeHypotheses, formatTs, type Hypothesis } from '../lib/hypotheses'
import { CardListSkeleton } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'

const STATUS_CONFIG = {
  open:       { labelKey: 'hypotheses.status_open',      color: 'bg-amber-100 text-amber-800',  icon: '' },
  challenged: { labelKey: 'hypotheses.status_challenged', color: 'bg-red-100 text-red-700',     icon: '' },
}

function HypothesisCard({ h }: { h: Hypothesis }) {
  const { t } = useTranslation()
  const cfg = STATUS_CONFIG[h.status as keyof typeof STATUS_CONFIG]
  return (
    <Link
      to={`/hypotheses/${h.id}`}
      className="block rounded-xl border border-stone-200 bg-white p-6 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-base font-semibold text-stone-900 leading-snug">{h.title}</h2>
        {cfg && (
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
            {cfg.icon} {t(cfg.labelKey)}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-stone-600 line-clamp-3">{h.description}</p>
      {h.status === 'challenged' && h.criticArgument && (
        <div className="mt-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700">
          <span className="font-medium"> {t('hypotheses.criticism')}: </span>
          {h.criticArgument.slice(0, 120)}…
        </div>
      )}
      <div className="mt-4 flex items-center gap-4 text-xs text-stone-400">
        <span> {t('hypotheses.ai_hypothesis')}</span>
        <span>{formatTs(h.generatedAt)}</span>
        {(h.commentCount ?? 0) > 0 && (
          <span> {h.commentCount !== 1 ? t('hypotheses.comment_count_plural', { count: h.commentCount }) : t('hypotheses.comment_count', { count: h.commentCount })}</span>
        )}
      </div>
    </Link>
  )
}

export default function Hypotheses() {
  const { t } = useTranslation()
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeHypotheses(h => {
      setHypotheses(h)
      setLoading(false)
    })
    return unsub
  }, [])

  const open = hypotheses.filter(h => h.status === 'open')
  const challenged = hypotheses.filter(h => h.status === 'challenged')

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-stone-900"> {t('hypotheses.title')}</h1>
        <p className="mt-2 text-stone-600">
          {t('hypotheses.subtitle')}
        </p>
      </div>

      <div className="mt-3 flex items-center gap-3 text-sm text-stone-500">
        <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800 font-medium">
           {t('hypotheses.open_count', { count: open.length })}
        </span>
        <span className="rounded-full bg-red-100 px-3 py-1 text-red-700 font-medium">
           {t('hypotheses.challenged_count', { count: challenged.length })}
        </span>
      </div>

      {loading && <div className="mt-8"><CardListSkeleton count={3} /></div>}

      {!loading && hypotheses.length === 0 && (
        <div className="mt-8">
          <EmptyState
            icon=""
            title={t('hypotheses.empty_title')}
            description={t('hypotheses.empty_text')}
          />
        </div>
      )}

      {open.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-stone-800"> {t('hypotheses.section_open')}</h2>
          <div className="space-y-4">
            {open.map(h => <HypothesisCard key={h.id} h={h} />)}
          </div>
        </section>
      )}

      {challenged.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-stone-800"> {t('hypotheses.section_challenged')}</h2>
          <p className="mb-4 text-sm text-stone-500">
            {t('hypotheses.section_challenged_desc')}
          </p>
          <div className="space-y-4">
            {challenged.map(h => <HypothesisCard key={h.id} h={h} />)}
          </div>
        </section>
      )}
    </div>
  )
}
