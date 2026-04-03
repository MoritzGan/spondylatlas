import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FirebaseError } from 'firebase/app'
import { useAuth } from '../contexts/AuthContext'
import { usePageMeta } from '../hooks/usePageMeta'

export default function ForgotPassword() {
  const { t } = useTranslation()
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  usePageMeta({
    title: `${t('auth.forgot_password_title')} | SpondylAtlas`,
    robots: 'noindex, nofollow',
  })

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await resetPassword(email)
      setSuccess(true)
    } catch (submitError) {
      if (
        submitError instanceof FirebaseError &&
        submitError.code === 'auth/user-not-found'
      ) {
        // Aus Sicherheitsgründen trotzdem Erfolgsmeldung anzeigen
        setSuccess(true)
      } else {
        setError(t('auth.error_generic'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-center text-2xl font-bold text-stone-900">
        {t('auth.forgot_password_title')}
      </h1>
      <p className="mt-3 text-center text-sm leading-6 text-stone-600">
        {t('auth.forgot_password_description')}
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {success ? (
        <div className="mt-8 rounded-lg bg-green-50 p-4 text-sm text-green-800">
          <p>{t('auth.forgot_password_success')}</p>
          <p className="mt-3">
            <Link to="/login" className="font-medium text-primary-600 hover:underline">
              {t('auth.back_to_login')}
            </Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-stone-700">
              {t('auth.email')}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary-600 py-2.5 font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            {t('auth.forgot_password_button')}
          </button>
        </form>
      )}

      {!success && (
        <p className="mt-6 text-center text-sm text-stone-600">
          <Link to="/login" className="font-medium text-primary-600 hover:underline">
            {t('auth.back_to_login')}
          </Link>
        </p>
      )}
    </div>
  )
}
