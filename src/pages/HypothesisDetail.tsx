import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { getHypothesis, getComments, addComment, formatTs, sanitizeCriticText, type Hypothesis, type HypothesisComment } from '../lib/hypotheses'
import { localized } from '../lib/localized'
import { DetailSkeleton } from '../components/Skeleton'

const STATUS_CONFIG: Record<string, { labelKey: string; badge: string; icon: string; descKey: string }> = {
  open:       { labelKey: 'hypotheses.status_open',       icon: '', badge: 'bg-amber-100 text-amber-800', descKey: 'hypotheses.status_open_desc' },
  challenged: { labelKey: 'hypotheses.status_challenged', icon: '', badge: 'bg-red-100 text-red-800',     descKey: 'hypotheses.status_challenged_desc' },
}

export default function HypothesisDetail() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [hypo, setHypo] = useState<Hypothesis | null>(null)
  const [comments, setComments] = useState<HypothesisComment[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([getHypothesis(id), getComments(id)]).then(([h, c]) => {
      setHypo(h)
      setComments(c)
      setLoading(false)
    })
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !id || !text.trim()) return
    setSubmitting(true)
    await addComment(id, text.trim(), user.uid, user.displayName ?? user.email ?? 'Anonym')
    const updated = await getComments(id)
    setComments(updated)
    setText('')
    setSubmitting(false)
  }

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-10"><DetailSkeleton /></div>
  if (!hypo) return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-stone-500">{t('hypotheses.not_found')}</p>
      <Link to="/hypotheses" className="mt-3 inline-block text-primary-600 hover:underline">← {t('hypotheses.back')}</Link>
    </div>
  )

  const cfg = STATUS_CONFIG[hypo.status]

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/hypotheses" className="text-sm text-primary-600 hover:underline">← {t('hypotheses.back')}</Link>

      {/* Main card */}
      <article className="mt-6 rounded-xl border border-stone-200 bg-white p-7">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-stone-900 leading-snug">{localized(hypo.title)}</h1>
          {cfg && (
            <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium ${cfg.badge}`}>
              {cfg.icon} {t(cfg.labelKey)}
            </span>
          )}
        </div>

        <div className="mt-1 text-xs text-stone-400">
           {t('hypotheses.generated_at', { date: formatTs(hypo.generatedAt) })}
        </div>

        <p className="mt-5 text-stone-700 leading-relaxed">{localized(hypo.description)}</p>

        <div className="mt-5 rounded-lg bg-amber-50 border border-amber-100 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">{t('hypotheses.rationale')}</p>
          <p className="text-sm text-stone-700 leading-relaxed">{localized(hypo.rationale)}</p>
        </div>
      </article>

      {/* Critic verdict */}
      {hypo.criticArgument && (
        <div className={`mt-4 rounded-xl border p-5 ${
          hypo.status === 'challenged'
            ? 'border-red-200 bg-red-50'
            : 'border-stone-200 bg-stone-50'
        }`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">
             {t('hypotheses.critic_agent')} — {cfg ? t(cfg.descKey) : ''}
          </p>
          <p className="text-sm text-stone-700 leading-relaxed">{sanitizeCriticText(localized(hypo.criticArgument), hypo.criticPaperTitles)}</p>
          {hypo.reviewedAt && (
            <p className="mt-2 text-xs text-stone-400">{t('hypotheses.reviewed_at', { date: formatTs(hypo.reviewedAt) })}</p>
          )}
        </div>
      )}

      {/* Comments */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-stone-900">
           {comments.length !== 1 ? t('hypotheses.comment_count_plural', { count: comments.length }) : t('hypotheses.comment_count', { count: comments.length })}
        </h2>

        <div className="mt-4 space-y-4">
          {comments.map(c => (
            <div key={c.id} className="rounded-xl border border-stone-100 bg-stone-50 p-4">
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium text-stone-800">{c.authorName}</span>
                <span className="text-stone-400 text-xs">{formatTs(c.createdAt)}</span>
              </div>
              <p className="mt-2 text-stone-700 whitespace-pre-wrap">{c.content}</p>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-stone-400 text-sm">{t('hypotheses.no_comments')}</p>
          )}
        </div>
      </section>

      {/* Comment form */}
      <section className="mt-6">
        {user ? (
          <form onSubmit={handleSubmit} className="rounded-xl border border-stone-200 bg-white p-5">
            <p className="text-sm font-medium text-stone-900 mb-3">{t('hypotheses.your_comment')}</p>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={4}
              maxLength={3000}
              placeholder={t('hypotheses.comment_placeholder')}
              className="w-full rounded-lg border border-stone-300 p-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-stone-400">{text.length}/3000</span>
              <button
                type="submit"
                disabled={submitting || !text.trim()}
                className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {submitting ? '…' : t('hypotheses.submit_comment')}
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-5 text-center text-sm text-stone-500">
            <Link to="/login" className="text-primary-600 hover:underline">{t('hypotheses.login_to_comment')}</Link>
            {' '}{t('hypotheses.login_to_comment_suffix')}
          </div>
        )}
      </section>
    </div>
  )
}
