import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { submitContentReport } from '../lib/compliance'
import { LEGAL_DOCUMENTS, localize } from '../lib/legal'
import { usePageMeta } from '../hooks/usePageMeta'

const REPORT_REASONS = [
  'illegal_content',
  'medical_misinformation',
  'harassment',
  'privacy_violation',
  'other',
] as const

export default function ReportContent() {
  const { i18n } = useTranslation()
  const { user } = useAuth()
  const [contentUrl, setContentUrl] = useState('')
  const [contentType, setContentType] = useState('forum_post')
  const [reason, setReason] = useState<(typeof REPORT_REASONS)[number]>('illegal_content')
  const [reporterEmail, setReporterEmail] = useState(user?.email ?? '')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const document = LEGAL_DOCUMENTS.reporting
  const isGerman = i18n.language.startsWith('de')

  usePageMeta({
    title: `${localize(i18n.language, document.title)} | SpondylAtlas`,
    description: localize(i18n.language, document.summary),
  })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await submitContentReport({
        reporterUserId: user?.uid ?? null,
        reporterEmail,
        contentUrl,
        contentType,
        reason,
        details,
      })
      setSubmitted(true)
      setContentUrl('')
      setContentType('forum_post')
      setReason('illegal_content')
      setDetails('')
    } catch (submitError) {
      setError((submitError as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary-700">
          {localize(i18n.language, document.label)}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-900">
          {localize(i18n.language, document.title)}
        </h1>
        <p className="mt-3 leading-7 text-stone-600">
          {localize(i18n.language, document.summary)}
        </p>

        <div className="mt-6 rounded-2xl bg-stone-50 p-5 text-sm leading-6 text-stone-700">
          <p>
            {isGerman
              ? 'Bitte beschreibe möglichst konkret, welcher Inhalt betroffen ist, warum du ihn meldest und wo er zu finden ist. Meldungen werden dokumentiert und für Moderations- bzw. Rechtszwecke aufbewahrt.'
              : 'Please describe as clearly as possible which content is affected, why you are reporting it, and where it can be found. Reports are documented and retained for moderation and legal purposes.'}
          </p>
        </div>

        {submitted && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {isGerman
              ? 'Die Meldung wurde gespeichert. Das Team kann sie nun prüfen.'
              : 'The report has been recorded. The team can now review it.'}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-stone-700">
              {isGerman ? 'Betroffene URL oder ID' : 'Affected URL or ID'}
            </span>
            <input
              required
              type="text"
              value={contentUrl}
              onChange={(event) => setContentUrl(event.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">
              {isGerman ? 'Inhaltstyp' : 'Content type'}
            </span>
            <select
              value={contentType}
              onChange={(event) => setContentType(event.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="forum_post">{isGerman ? 'Forenbeitrag' : 'Forum post'}</option>
              <option value="forum_reply">{isGerman ? 'Antwort' : 'Reply'}</option>
              <option value="profile">{isGerman ? 'Profil' : 'Profile'}</option>
              <option value="other">{isGerman ? 'Sonstiges' : 'Other'}</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">
              {isGerman ? 'Grund der Meldung' : 'Reason for report'}
            </span>
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value as (typeof REPORT_REASONS)[number])}
              className="mt-1 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="illegal_content">{isGerman ? 'Rechtswidriger Inhalt' : 'Illegal content'}</option>
              <option value="medical_misinformation">{isGerman ? 'Gesundheitsbezogene Falschinformation' : 'Medical misinformation'}</option>
              <option value="harassment">{isGerman ? 'Belästigung / Hassrede' : 'Harassment / hate speech'}</option>
              <option value="privacy_violation">{isGerman ? 'Datenschutzverletzung' : 'Privacy violation'}</option>
              <option value="other">{isGerman ? 'Sonstiges' : 'Other'}</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">
              {isGerman ? 'Kontakt-E-Mail (optional)' : 'Contact email (optional)'}
            </span>
            <input
              type="email"
              value={reporterEmail}
              onChange={(event) => setReporterEmail(event.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">
              {isGerman ? 'Beschreibung' : 'Description'}
            </span>
            <textarea
              required
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              rows={6}
              className="mt-1 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </label>

          <label className="flex items-start gap-3 rounded-2xl bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-700">
            <input required type="checkbox" className="mt-1 h-4 w-4 rounded border-stone-300 text-primary-600 focus:ring-primary-500" />
            <span>
              {isGerman
                ? 'Ich bestätige nach bestem Wissen, dass die Meldung in gutem Glauben erfolgt und die Angaben sachlich richtig sind.'
                : 'I confirm to the best of my knowledge that this report is submitted in good faith and that the information provided is factually accurate.'}
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-primary-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
          >
            {submitting
              ? isGerman ? 'Meldung wird gesendet...' : 'Submitting report...'
              : isGerman ? 'Meldung absenden' : 'Submit report'}
          </button>
        </form>
      </div>
    </div>
  )
}
