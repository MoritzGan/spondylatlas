import { useId, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import LanguageSwitcher from './LanguageSwitcher'
import { PUBLIC_LEGAL_NAV, localize } from '../lib/legal'

function desktopNavClass(isActive: boolean) {
  return `rounded-full px-4 py-2 text-sm font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 ${
    isActive
      ? 'bg-primary-100 text-primary-800 shadow-sm'
      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
  }`
}

function mobileNavClass(isActive: boolean) {
  return `rounded-2xl px-4 py-3 text-sm font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 ${
    isActive
      ? 'bg-primary-100 text-primary-800'
      : 'bg-stone-50 text-stone-700 hover:bg-primary-50 hover:text-primary-800'
  }`
}

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuPath, setMenuPath] = useState<string | null>(null)
  const mobileMenuId = useId()

  const menuOpen = menuPath === location.pathname

  async function handleLogout() {
    setMenuPath(null)
    await logout()
    navigate('/')
  }

  function closeMenu() {
    setMenuPath(null)
  }

  const primaryLinks = [
    { to: '/', label: t('nav.home'), end: true },
    { to: '/research', label: t('nav.research') },
    { to: '/forum', label: t('nav.forum') },
    { to: '/hypotheses', label: ' Hypothesen' },
    { to: '/arena', label: 'Arena' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-stone-50/90 shadow-[0_12px_40px_-28px_rgba(28,25,23,0.45)] backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex items-center justify-between gap-3 rounded-[1.75rem] border border-white/70 bg-white/88 px-3 py-2 shadow-[0_18px_45px_-30px_rgba(120,53,15,0.4)] ring-1 ring-stone-200/70 md:px-4">
          <Link
            to="/"
            onClick={closeMenu}
            className="flex min-w-0 items-center gap-3 rounded-full px-2 py-1.5 transition duration-200 hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
          >
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-600 to-accent-600 p-1.5 text-white shadow-lg shadow-primary-900/15">
              <img src="/images/logo.webp" alt="" className="h-full w-full object-contain" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-serif text-2xl font-semibold tracking-tight text-stone-900">
                SpondylAtlas
              </span>
              <span className="hidden text-xs uppercase tracking-[0.24em] text-stone-500 lg:block">
                {t('nav.tagline')}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {primaryLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => desktopNavClass(isActive)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <LanguageSwitcher />

            {user ? (
              <>
                <NavLink to="/profile" className={({ isActive }) => desktopNavClass(isActive)}>
                  {t('nav.profile')}
                </NavLink>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="rounded-full px-4 py-2 text-sm font-medium text-stone-600 transition duration-200 hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={({ isActive }) => desktopNavClass(isActive)}>
                  {t('nav.login')}
                </NavLink>
                <Link
                  to="/register"
                  className="rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
                >
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuPath((current) => (current === location.pathname ? null : location.pathname))}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 md:hidden ${
              menuOpen
                ? 'border-primary-200 bg-primary-50 text-primary-800'
                : 'border-stone-200 bg-white text-stone-700 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-800'
            }`}
            aria-label={menuOpen ? t('nav.close_menu') : t('nav.open_menu')}
            aria-expanded={menuOpen}
            aria-controls={mobileMenuId}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-stone-200/80 bg-stone-50/90 px-4 pb-4 md:hidden">
          <nav
            id={mobileMenuId}
            className="mx-auto max-w-6xl rounded-[1.75rem] border border-white/80 bg-white/92 p-4 shadow-[0_20px_50px_-32px_rgba(28,25,23,0.45)] ring-1 ring-stone-200/70"
          >
            <div className="flex flex-col gap-5">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">
                  {t('nav.menu')}
                </p>
                <div className="flex flex-col gap-2">
                  {primaryLinks.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={closeMenu}
                      className={({ isActive }) => mobileNavClass(isActive)}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>

              <div className="border-t border-stone-100 pt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">
                  {user ? t('nav.account') : t('nav.access')}
                </p>
                <div className="flex flex-col gap-2">
                  {user ? (
                    <>
                      <NavLink to="/profile" onClick={closeMenu} className={({ isActive }) => mobileNavClass(isActive)}>
                        {t('nav.profile')}
                      </NavLink>
                      <button
                        type="button"
                        onClick={() => void handleLogout()}
                        className="rounded-2xl px-4 py-3 text-left text-sm font-medium text-stone-700 transition duration-200 hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
                      >
                        {t('nav.logout')}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/register"
                        onClick={closeMenu}
                        className="rounded-2xl bg-primary-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
                      >
                        {t('nav.register')}
                      </Link>
                      <NavLink to="/login" onClick={closeMenu} className={({ isActive }) => mobileNavClass(isActive)}>
                        {t('nav.login')}
                      </NavLink>
                    </>
                  )}
                </div>
              </div>

              <div className="border-t border-stone-100 pt-5">
                <LanguageSwitcher variant="mobile" />
              </div>

              <div className="border-t border-stone-100 pt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">
                  {i18n.language.startsWith('de') ? 'Rechtliches' : 'Legal'}
                </p>
                <div className="grid gap-2">
                  {PUBLIC_LEGAL_NAV.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={closeMenu}
                      className="rounded-2xl px-4 py-3 text-sm font-medium text-stone-600 transition duration-200 hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
                    >
                      {localize(i18n.language, item.label)}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
