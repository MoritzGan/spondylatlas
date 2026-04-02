import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import LanguageSwitcher from './LanguageSwitcher'
import { PUBLIC_LEGAL_NAV, localize } from '../lib/legal'

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary-700">
          <svg className="h-8 w-8" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" fill="currentColor" />
            <text x="32" y="42" textAnchor="middle" fontSize="28" fontFamily="Georgia" fontWeight="bold" fill="white">SA</text>
          </svg>
          SpondylAtlas
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/forum" className="text-gray-600 transition-colors hover:text-primary-700">
            {t('nav.forum')}
          </Link>
          <Link to="/research" className="text-gray-600 transition-colors hover:text-primary-700">
            {t('nav.research')}
          </Link>
          {user ? (
            <>
              <Link to="/profile" className="text-gray-600 transition-colors hover:text-primary-700">
                {t('nav.profile')}
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-600 transition-colors hover:text-primary-700"
              >
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 transition-colors hover:text-primary-700">
                {t('nav.login')}
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
              >
                {t('nav.register')}
              </Link>
            </>
          )}
          <LanguageSwitcher />
        </nav>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center md:hidden"
          aria-label="Menu"
        >
          <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <nav className="border-t border-gray-100 bg-white px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-3 pt-3">
            <Link to="/forum" onClick={() => setMenuOpen(false)} className="text-gray-600">
              {t('nav.forum')}
            </Link>
            <Link to="/research" onClick={() => setMenuOpen(false)} className="text-gray-600">
              {t('nav.research')}
            </Link>
            {user ? (
              <>
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="text-gray-600">
                  {t('nav.profile')}
                </Link>
                <button
                  onClick={() => {
                    void handleLogout()
                    setMenuOpen(false)
                  }}
                  className="text-left text-gray-600"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="text-gray-600">
                  {t('nav.login')}
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="text-gray-600">
                  {t('nav.register')}
                </Link>
              </>
            )}
            <LanguageSwitcher />

            <div className="mt-2 border-t border-stone-100 pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
                {i18n.language.startsWith('de') ? 'Rechtliches' : 'Legal'}
              </p>
              <div className="flex flex-col gap-2">
                {PUBLIC_LEGAL_NAV.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMenuOpen(false)}
                    className="text-gray-600"
                  >
                    {localize(i18n.language, item.label)}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
