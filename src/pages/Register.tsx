import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FirebaseError } from 'firebase/app'
import { useAuth } from '../contexts/AuthContext'
import { usePageMeta } from '../hooks/usePageMeta'

function FieldError({ message }: { message: string | undefined }) {
  if (!message) return null
  return <p className="mt-1 text-sm text-red-600">{message}</p>
}

export default function Register() {
  const { t, i18n } = useTranslation()
  const { register } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [healthNoticeAccepted, setHealthNoticeAccepted] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const isGerman = i18n.language.startsWith('de')

  usePageMeta({
    title: `${t('auth.register_title')} | SpondylAtlas`,
    robots: 'noindex, nofollow',
  })

  function getFieldErrors() {
    const errors: Record<string, string> = {}
    if (!displayName.trim()) errors.displayName = t('auth.error_name_required')
    if (!email.trim()) errors.email = t('auth.error_email_required')
    if (!password) {
      errors.password = t('auth.error_password_required')
    } else if (password.length < 12) {
      errors.password = t('auth.error_password_min_length')
    }
    if (!confirmPassword) {
      errors.confirmPassword = t('auth.error_confirm_password_required')
    } else if (password !== confirmPassword) {
      errors.confirmPassword = t('auth.error_password_mismatch')
    }
    return errors
  }

  const fieldErrors = submitted ? getFieldErrors() : {}
  const hasFieldErrors = Object.keys(fieldErrors).length > 0

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    setError('')

    const errors = getFieldErrors()
    if (Object.keys(errors).length > 0) return

    setLoading(true)

    try {
      await register({ email, password, displayName })
      navigate('/profile')
    } catch (submitError) {
      if (submitError instanceof FirebaseError && submitError.code === 'auth/email-already-in-use') {
        setError(t('auth.error_email_in_use'))
      } else {
        setError(t('auth.error_generic'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-center text-2xl font-bold text-stone-900">{t('auth.register_title')}</h1>
      <p className="mt-3 text-center text-sm leading-6 text-stone-600">
        {isGerman
          ? 'Mit der Registrierung bestätigst du, dass du mindestens 18 Jahre alt bist, die Rechtsdokumente gelesen hast und die Community sensible gesundheitsbezogene Angaben enthalten kann.'
          : 'By registering, you confirm that you are at least 18 years old, have read the legal documents, and understand that the community may contain sensitive health-related information.'}
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-4">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-stone-700">
            {t('auth.display_name')}
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            aria-invalid={!!fieldErrors.displayName}
            aria-describedby={fieldErrors.displayName ? 'displayName-error' : undefined}
            className={`mt-1 w-full rounded-lg border px-4 py-2.5 text-stone-900 focus:outline-none focus:ring-2 ${fieldErrors.displayName ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-stone-300 focus:border-primary-500 focus:ring-primary-500/20'}`}
          />
          <FieldError message={fieldErrors.displayName} />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-stone-700">
            {t('auth.email')}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            className={`mt-1 w-full rounded-lg border px-4 py-2.5 text-stone-900 focus:outline-none focus:ring-2 ${fieldErrors.email ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-stone-300 focus:border-primary-500 focus:ring-primary-500/20'}`}
          />
          <FieldError message={fieldErrors.email} />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-stone-700">
            {t('auth.password')}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={!!fieldErrors.password}
            aria-describedby={fieldErrors.password ? 'password-error' : undefined}
            className={`mt-1 w-full rounded-lg border px-4 py-2.5 text-stone-900 focus:outline-none focus:ring-2 ${fieldErrors.password ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-stone-300 focus:border-primary-500 focus:ring-primary-500/20'}`}
          />
          <FieldError message={fieldErrors.password} />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-stone-700">
            {t('auth.confirm_password')}
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            aria-invalid={!!fieldErrors.confirmPassword}
            aria-describedby={fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined}
            className={`mt-1 w-full rounded-lg border px-4 py-2.5 text-stone-900 focus:outline-none focus:ring-2 ${fieldErrors.confirmPassword ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-stone-300 focus:border-primary-500 focus:ring-primary-500/20'}`}
          />
          <FieldError message={fieldErrors.confirmPassword} />
        </div>

        <label className="flex items-start gap-3 rounded-2xl bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-700">
          <input
            required
            checked={ageConfirmed}
            onChange={(event) => setAgeConfirmed(event.target.checked)}
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-stone-300 text-primary-600 focus:ring-primary-500"
          />
          <span>
            {isGerman
              ? 'Ich bestätige, dass ich mindestens 18 Jahre alt bin.'
              : 'I confirm that I am at least 18 years old.'}
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-2xl bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-700">
          <input
            required
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-stone-300 text-primary-600 focus:ring-primary-500"
          />
          <span>
            {isGerman
              ? 'Ich akzeptiere die Nutzungsbedingungen und Community-Regeln.'
              : 'I accept the terms of use and community rules.'}
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-2xl bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-700">
          <input
            required
            checked={privacyAccepted}
            onChange={(event) => setPrivacyAccepted(event.target.checked)}
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-stone-300 text-primary-600 focus:ring-primary-500"
          />
          <span>
            {isGerman
              ? 'Ich habe Datenschutzhinweise sowie Cookies- und Speicherübersicht gelesen.'
              : 'I have read the privacy notice and the cookies and storage overview.'}
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-2xl bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-700">
          <input
            required
            checked={healthNoticeAccepted}
            onChange={(event) => setHealthNoticeAccepted(event.target.checked)}
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-stone-300 text-primary-600 focus:ring-primary-500"
          />
          <span>
            {isGerman
              ? 'Ich weiß, dass Community-Inhalte gesundheitsbezogene Angaben enthalten können und dass für den Community-Zugang zusätzlich eine gesonderte Einwilligung erforderlich ist.'
              : 'I understand that community content may contain health-related information and that separate consent is required before community access.'}
          </span>
        </label>

        <button
          type="submit"
          disabled={loading || !ageConfirmed || !termsAccepted || !privacyAccepted || !healthNoticeAccepted}
          className="w-full rounded-lg bg-primary-600 py-2.5 font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
        >
          {t('auth.register_button')}
        </button>

        {submitted && hasFieldErrors && (
          <p className="text-center text-sm text-red-600">
            {isGerman
              ? 'Bitte fülle alle Pflichtfelder aus.'
              : 'Please fill in all required fields.'}
          </p>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-stone-600">
        {t('auth.has_account')}{' '}
        <Link to="/login" className="font-medium text-primary-600 hover:underline">
          {t('nav.login')}
        </Link>
      </p>
    </div>
  )
}
