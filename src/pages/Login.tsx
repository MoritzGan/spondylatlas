import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FirebaseError } from 'firebase/app'
import { useAuth } from '../contexts/AuthContext'
import { usePageMeta } from '../hooks/usePageMeta'

export default function Login() {
  const { t, i18n } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? '/profile'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const isGerman = i18n.language.startsWith('de')

  usePageMeta({
    title: `${t('auth.login_title')} | SpondylAtlas`,
    robots: 'noindex, nofollow',
  })

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (submitError) {
      if (submitError instanceof FirebaseError && submitError.code === 'auth/invalid-credential') {
        setError(t('auth.error_invalid_credentials'))
      } else {
        setError(t('auth.error_generic'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-center text-2xl font-bold text-stone-900">{t('auth.login_title')}</h1>
      <p className="mt-3 text-center text-sm leading-6 text-stone-600">
        {isGerman
          ? 'Die Community ist nur für volljährige Nutzer vorgesehen. Für den Zugang zum geschützten Bereich ist eine bestätigte E-Mail-Adresse erforderlich.'
          : 'The community is intended for adult users only. A verified email address is required for access to the protected area.'}
      </p>

      {from !== '/profile' && (
        <div className="mt-4 rounded-lg bg-sky-50 border border-sky-200 p-3 text-sm text-sky-700">
          {isGerman
            ? 'Bitte melde dich an, um diesen Bereich zu sehen.'
            : 'Please sign in to access this area.'}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

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
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-stone-700">
            {t('auth.password')}
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <div className="text-right">
          <Link to="/passwort-vergessen" className="text-sm font-medium text-primary-600 hover:underline">
            {t('auth.forgot_password_link')}
          </Link>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary-600 py-2.5 font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
        >
          {t('auth.login_button')}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-600">
        {t('auth.no_account')}{' '}
        <Link to="/register" className="font-medium text-primary-600 hover:underline">
          {t('nav.register')}
        </Link>
      </p>
    </div>
  )
}
