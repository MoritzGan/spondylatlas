import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getHypothesis, getComments, addComment, formatTs, type Hypothesis, type HypothesisComment } from '../lib/hypotheses'

const STATUS_LABEL: Record<string, { label: string; color: string; icon: string; desc: string }> = {
  open:       { label: 'Offen',       icon: '', color: 'amber', desc: 'Nicht widerlegbar — Hypothese steht im Raum.' },
  challenged: { label: 'Angefochten', icon: '', color: 'red',   desc: 'Der Critic-Agent hat Gegenargumente gefunden.' },
}

export default function HypothesisDetail() {
  const { id } = useParams<{ id: string }>()
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

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-10 text-gray-400">Einen Moment…</div>
  if (!hypo) return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-gray-500">Hypothese nicht gefunden.</p>
      <Link to="/hypotheses" className="mt-3 inline-block text-primary-600 hover:underline">← Zurück</Link>
    </div>
  )

  const cfg = STATUS_LABEL[hypo.status]

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/hypotheses" className="text-sm text-primary-600 hover:underline">← KI-Hypothesen</Link>

      {/* Main card */}
      <article className="mt-6 rounded-xl border border-gray-200 bg-white p-7">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 leading-snug">{hypo.title}</h1>
          {cfg && (
            <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium bg-${cfg.color}-100 text-${cfg.color}-800`}>
              {cfg.icon} {cfg.label}
            </span>
          )}
        </div>

        <div className="mt-1 text-xs text-gray-400">
           Generiert am {formatTs(hypo.generatedAt)}
        </div>

        <p className="mt-5 text-gray-700 leading-relaxed">{hypo.description}</p>

        <div className="mt-5 rounded-lg bg-amber-50 border border-amber-100 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">Begründung</p>
          <p className="text-sm text-gray-700 leading-relaxed">{hypo.rationale}</p>
        </div>
      </article>

      {/* Critic verdict */}
      {hypo.criticArgument && (
        <div className={`mt-4 rounded-xl border p-5 ${
          hypo.status === 'challenged'
            ? 'border-red-200 bg-red-50'
            : 'border-gray-200 bg-gray-50'
        }`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
             Critic-Agent — {cfg?.desc}
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">{hypo.criticArgument}</p>
          {hypo.reviewedAt && (
            <p className="mt-2 text-xs text-gray-400">Geprüft am {formatTs(hypo.reviewedAt)}</p>
          )}
        </div>
      )}

      {/* Comments */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900">
           {comments.length} Kommentar{comments.length !== 1 ? 'e' : ''}
        </h2>

        <div className="mt-4 space-y-4">
          {comments.map(c => (
            <div key={c.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium text-gray-800">{c.authorName}</span>
                <span className="text-gray-400 text-xs">{formatTs(c.createdAt)}</span>
              </div>
              <p className="mt-2 text-gray-700 whitespace-pre-wrap">{c.content}</p>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-gray-400 text-sm">Noch keine Kommentare — sei die erste Person!</p>
          )}
        </div>
      </section>

      {/* Comment form */}
      <section className="mt-6">
        {user ? (
          <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm font-medium text-gray-900 mb-3">Dein Kommentar</p>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={4}
              maxLength={3000}
              placeholder="Was denkst du über diese Hypothese? Hast du eigene Erfahrungen oder Hinweise?"
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-gray-400">{text.length}/3000</span>
              <button
                type="submit"
                disabled={submitting || !text.trim()}
                className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {submitting ? '…' : 'Kommentieren'}
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center text-sm text-gray-500">
            <Link to="/login" className="text-primary-600 hover:underline">Anmelden</Link>
            {' '}um zu kommentieren.
          </div>
        )}
      </section>
    </div>
  )
}
