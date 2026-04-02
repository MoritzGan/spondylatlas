import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { getHealthDataConsent, submitAccountRequest, withdrawHealthDataConsent } from '../lib/compliance'
import { LEGAL_VERSION } from '../lib/legal'
import { usePageMeta } from '../hooks/usePageMeta'

export default function Profile() {
  const { t, i18n } = useTranslation()
  const { user, resendVerificationEmail } = useAuth()
  const [hasHealthConsent, setHasHealthConsent] = useState(false)
  const [loadingConsent, setLoadingConsent] = useState(true)
  const [pendingRequest, setPendingRequest] = useState<'export' | 'delete' | null>(null)
  const isGerman = i18n.language.startsWith('de')

  usePageMeta({
    title: `${t('profile.title')} | SpondylAtlas`,
    robots: 'noindex, nofollow',
  })

  useEffect(() => {
    const loadConsent = async () => {
      if (!user) {
        setLoadingConsent(false)
        return
      }

      try {
        const consent = await getHealthDataConsent(user.uid)
        setHasHealthConsent(Boolean(consent?.granted))
      } finally {
        setLoadingConsent(false)
      }
    }

    void loadConsent()
  }, [user])

  async function handleAccountRequest(type: 'export' | 'delete') {
    if (!user) return

    setPendingRequest(type)
    try {
      await submitAccountRequest(user, type)
    } finally {
      setPendingRequest(null)
    }
  }

  async function handleWithdrawConsent() {
    if (!user) return

    await withdrawHealthDataConsent(user)
    setHasHealthConsent(false)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">{t('profile.title')}</h1>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-700">
            {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {user?.displayName || user?.email}
            </h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        <dl className="mt-6 space-y-4">
          <div className="flex justify-between border-b border-gray-100 pb-3">
            <dt className="font-medium text-gray-700">{t('profile.member_since')}</dt>
            <dd className="text-gray-600">
              {user?.metadata.creationTime
                ? new Date(user.metadata.creationTime).toLocaleDateString()
                : '-'}
            </dd>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-3">
            <dt className="font-medium text-gray-700">{t('profile.role')}</dt>
            <dd className="text-gray-600">{t('profile.roles.user')}</dd>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-3">
            <dt className="font-medium text-gray-700">{isGerman ? 'E-Mail bestätigt' : 'Email verified'}</dt>
            <dd className="text-gray-600">{user?.emailVerified ? (isGerman ? 'Ja' : 'Yes') : (isGerman ? 'Nein' : 'No')}</dd>
          </div>
          <div className="flex justify-between pb-3">
            <dt className="font-medium text-gray-700">{isGerman ? 'Rechtsversion' : 'Legal version'}</dt>
            <dd className="text-gray-600">{LEGAL_VERSION}</dd>
          </div>
        </dl>
      </div>

      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {isGerman ? 'Compliance-Status' : 'Compliance status'}
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-6 text-stone-700">
          <p>
            {user?.emailVerified
              ? isGerman ? 'Deine E-Mail-Adresse ist bestätigt.' : 'Your email address is verified.'
              : isGerman ? 'Deine E-Mail-Adresse ist noch nicht bestätigt.' : 'Your email address is not verified yet.'}
          </p>
          {!user?.emailVerified && (
            <button
              type="button"
              onClick={() => void resendVerificationEmail()}
              className="rounded-xl border border-stone-300 px-4 py-2 font-medium text-stone-700 transition-colors hover:border-primary-400 hover:text-primary-700"
            >
              {isGerman ? 'Bestätigungs-E-Mail erneut senden' : 'Resend verification email'}
            </button>
          )}
          <p>
            {loadingConsent
              ? isGerman ? 'Einwilligungsstatus wird geladen...' : 'Loading consent status...'
              : hasHealthConsent
                ? isGerman ? 'Die dokumentierte Einwilligung für gesundheitsbezogene Community-Inhalte ist aktiv.' : 'The documented consent for health-related community content is active.'
                : isGerman ? 'Der Zugang zur Community ist derzeit gesperrt, weil keine aktive Gesundheitsdaten-Einwilligung vorliegt.' : 'Community access is currently blocked because there is no active health-data consent.'}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {hasHealthConsent && (
            <button
              type="button"
              onClick={() => void handleWithdrawConsent()}
              className="rounded-xl border border-red-300 px-4 py-2 font-medium text-red-700 transition-colors hover:bg-red-50"
            >
              {isGerman ? 'Gesundheitsdaten-Einwilligung widerrufen' : 'Withdraw health-data consent'}
            </button>
          )}
          <Link
            to="/cookies-und-speicherungen"
            className="rounded-xl border border-stone-300 px-4 py-2 font-medium text-stone-700 transition-colors hover:border-primary-400 hover:text-primary-700"
          >
            {isGerman ? 'Speicherübersicht' : 'Storage notice'}
          </Link>
          <Link
            to="/kontakt-datenschutz"
            className="rounded-xl border border-stone-300 px-4 py-2 font-medium text-stone-700 transition-colors hover:border-primary-400 hover:text-primary-700"
          >
            {isGerman ? 'Datenschutzkontakt' : 'Privacy contact'}
          </Link>
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {isGerman ? 'Betroffenenrechte' : 'Data subject rights'}
        </h2>
        <p className="mt-3 text-sm leading-6 text-stone-700">
          {isGerman
            ? 'Anträge werden als Nachweis gespeichert und müssen anschließend manuell bearbeitet werden.'
            : 'Requests are stored as compliance records and must then be processed manually.'}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleAccountRequest('export')}
            disabled={pendingRequest !== null}
            className="rounded-xl bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
          >
            {pendingRequest === 'export'
              ? isGerman ? 'Export wird angefordert...' : 'Requesting export...'
              : isGerman ? 'Datenexport anfordern' : 'Request data export'}
          </button>
          <button
            type="button"
            onClick={() => void handleAccountRequest('delete')}
            disabled={pendingRequest !== null}
            className="rounded-xl border border-red-300 px-4 py-2 font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60"
          >
            {pendingRequest === 'delete'
              ? isGerman ? 'Löschantrag wird angefordert...' : 'Requesting deletion...'
              : isGerman ? 'Kontolöschung anfordern' : 'Request account deletion'}
          </button>
        </div>
      </section>
    </div>
  )
}
