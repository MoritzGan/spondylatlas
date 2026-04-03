import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { getHealthDataConsent } from '../lib/compliance'

export default function ProtectedRoute({
  children,
  requireVerifiedEmail = false,
  requireHealthConsent = false,
}: {
  children: ReactNode
  requireVerifiedEmail?: boolean
  requireHealthConsent?: boolean
}) {
  const { i18n } = useTranslation()
  const { user, loading, resendVerificationEmail } = useAuth()
  const isGerman = i18n.language.startsWith('de')
  const [consentLoading, setConsentLoading] = useState(requireHealthConsent)
  const [hasHealthConsent, setHasHealthConsent] = useState(false)

  useEffect(() => {
    if (!requireHealthConsent || !user) {
      setConsentLoading(false)
      setHasHealthConsent(false)
      return
    }

    let cancelled = false
    setConsentLoading(true)

    getHealthDataConsent(user.uid)
      .then((consent) => {
        if (!cancelled) {
          setHasHealthConsent(Boolean(consent?.granted))
        }
      })
      .finally(() => {
        if (!cancelled) {
          setConsentLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [requireHealthConsent, user])

  if (loading || consentLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireVerifiedEmail && !user.emailVerified) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8">
          <h1 className="text-2xl font-semibold text-stone-900">
            {isGerman ? 'E-Mail-Bestätigung erforderlich' : 'Email verification required'}
          </h1>
          <p className="mt-3 leading-7 text-stone-700">
            {isGerman
              ? 'Die Community ist erst nach bestätigter E-Mail-Adresse zugänglich. Bitte bestätige dein Konto über den Link in der zuletzt gesendeten E-Mail.'
              : 'The community is available only after the email address has been verified. Please confirm your account using the link in the latest verification email.'}
          </p>
          <button
            type="button"
            onClick={() => void resendVerificationEmail()}
            className="mt-6 rounded-xl bg-primary-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-primary-700"
          >
            {isGerman ? 'Bestätigungs-E-Mail erneut senden' : 'Resend verification email'}
          </button>
        </div>
      </div>
    )
  }

  if (requireHealthConsent && !hasHealthConsent) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-3xl border border-sky-200 bg-sky-50 p-8">
          <h1 className="text-2xl font-semibold text-stone-900">
            {isGerman ? 'Gesundheitsdaten-Einwilligung erforderlich' : 'Health-data consent required'}
          </h1>
          <p className="mt-3 leading-7 text-stone-700">
            {isGerman
              ? 'Der Community-Zugang wird jetzt serverseitig nur mit aktiver Gesundheitsdaten-Einwilligung freigeschaltet. Du kannst die Einwilligung im Profil erteilen.'
              : 'Community access is now enforced server-side and requires an active health-data consent. You can grant the consent in your profile.'}
          </p>
          <Link
            to="/profile"
            className="mt-6 inline-flex rounded-xl bg-primary-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-primary-700"
          >
            {isGerman ? 'Zum Profil' : 'Open profile'}
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
