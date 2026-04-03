import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { hasActiveCommunityAccess } from '../lib/communityAccess'

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
  const [communityAccess, setCommunityAccess] = useState<'loading' | 'granted' | 'blocked'>(
    requireHealthConsent ? 'loading' : 'granted',
  )
  const isGerman = i18n.language.startsWith('de')

  useEffect(() => {
    if (!requireHealthConsent || !user) {
      return
    }

    let active = true

    const loadAccess = async () => {
      const granted = await hasActiveCommunityAccess(user)
      if (active) {
        setCommunityAccess(granted ? 'granted' : 'blocked')
      }
    }

    void loadAccess()

    return () => {
      active = false
    }
  }, [requireHealthConsent, user])

  if (loading || (requireHealthConsent && user && communityAccess === 'loading')) {
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
            {isGerman ? 'E-Mail-Bestaetigung erforderlich' : 'Email verification required'}
          </h1>
          <p className="mt-3 leading-7 text-stone-700">
            {isGerman
              ? 'Die Community ist erst nach bestaetigter E-Mail-Adresse zugaenglich. Bitte bestaetige dein Konto ueber den Link in der zuletzt gesendeten E-Mail.'
              : 'The community is available only after the email address has been verified. Please confirm your account using the link in the latest verification email.'}
          </p>
          <button
            type="button"
            onClick={() => void resendVerificationEmail()}
            className="mt-6 rounded-xl bg-primary-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-primary-700"
          >
            {isGerman ? 'Bestaetigungs-E-Mail erneut senden' : 'Resend verification email'}
          </button>
        </div>
      </div>
    )
  }

  if (requireHealthConsent && communityAccess !== 'granted') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8">
          <h1 className="text-2xl font-semibold text-stone-900">
            {isGerman ? 'Community-Zugang gesperrt' : 'Community access blocked'}
          </h1>
          <p className="mt-3 leading-7 text-stone-700">
            {isGerman
              ? 'Fuer den Zugriff auf die geschuetzte Community ist eine aktive Gesundheitsdaten-Einwilligung erforderlich. Du kannst den Status in deinem Profil pruefen.'
              : 'Access to the protected community requires active consent for health-related information. You can review the status in your profile.'}
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
