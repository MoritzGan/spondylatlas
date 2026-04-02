import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { subscribeHypotheses, formatTs, type Hypothesis } from '../lib/hypotheses'

const STATUS_CONFIG = {
  open:       { label: 'Offen',      color: 'bg-amber-100 text-amber-800',  icon: '' },
  challenged: { label: 'Angefochten', color: 'bg-red-100 text-red-700',     icon: '' },
}

function HypothesisCard({ h }: { h: Hypothesis }) {
  const cfg = STATUS_CONFIG[h.status as keyof typeof STATUS_CONFIG]
  return (
    <Link
      to={`/hypotheses/${h.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-base font-semibold text-gray-900 leading-snug">{h.title}</h2>
        {cfg && (
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
            {cfg.icon} {cfg.label}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-gray-600 line-clamp-3">{h.description}</p>
      {h.status === 'challenged' && h.criticArgument && (
        <div className="mt-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700">
          <span className="font-medium"> Kritik: </span>
          {h.criticArgument.slice(0, 120)}…
        </div>
      )}
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
        <span> KI-Hypothese</span>
        <span>{formatTs(h.generatedAt)}</span>
        {(h.commentCount ?? 0) > 0 && (
          <span> {h.commentCount} Kommentar{h.commentCount !== 1 ? 'e' : ''}</span>
        )}
      </div>
    </Link>
  )
}

export default function Hypotheses() {
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
        <h1 className="text-3xl font-bold text-gray-900"> KI-Hypothesen</h1>
        <p className="mt-2 text-gray-600">
          Neue wissenschaftliche Hypothesen, automatisch aus aktuellen Studien abgeleitet —
          und von einem zweiten Agenten kritisch geprüft. Was denkst du?
        </p>
      </div>

      <div className="mt-3 flex items-center gap-3 text-sm text-gray-500">
        <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800 font-medium">
           {open.length} offen
        </span>
        <span className="rounded-full bg-red-100 px-3 py-1 text-red-700 font-medium">
           {challenged.length} angefochten
        </span>
      </div>

      {loading && <p className="mt-10 text-gray-400">Einen Moment…</p>}

      {!loading && hypotheses.length === 0 && (
        <div className="mt-10 rounded-xl border border-dashed border-gray-200 p-10 text-center text-gray-400">
          <div className="text-4xl mb-3"></div>
          <p>Die Agenten arbeiten noch — erste Hypothesen erscheinen in Kürze.</p>
        </div>
      )}

      {open.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-800"> Offene Hypothesen</h2>
          <div className="space-y-4">
            {open.map(h => <HypothesisCard key={h.id} h={h} />)}
          </div>
        </section>
      )}

      {challenged.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-gray-800"> Angefochten</h2>
          <p className="mb-4 text-sm text-gray-500">
            Diese Hypothesen wurden vom Critic-Agenten in Frage gestellt — die Debatte läuft.
          </p>
          <div className="space-y-4">
            {challenged.map(h => <HypothesisCard key={h.id} h={h} />)}
          </div>
        </section>
      )}
    </div>
  )
}
