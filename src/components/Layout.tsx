import type { ReactNode } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from './Navbar'
import { PUBLIC_LEGAL_NAV, localize } from '../lib/legal'

export default function Layout() {
  const { i18n, t } = useTranslation()
  const isGerman = i18n.language.startsWith('de')

  const primaryLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/research', label: t('nav.research') },
    { to: '/forum', label: t('nav.forum') },
  ]

  const communityLinks = [
    { to: '/profile', label: isGerman ? 'Profil & Rechte' : 'Profile & rights' },
    { to: '/login', label: t('nav.login') },
    { to: '/register', label: t('nav.register') },
  ]

  const trustPoints = [
    t('footer.trust_privacy'),
    t('footer.trust_adults'),
    t('footer.trust_moderation'),
  ]

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="relative mt-10 border-t border-stone-200/80 bg-[linear-gradient(180deg,rgba(245,245,244,0.65),rgba(255,255,255,0.98))]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent" />
        <div className="mx-auto max-w-6xl px-4 py-4 sm:py-5">
          <div className="rounded-[1.6rem] border border-white/80 bg-white/92 p-5 shadow-[0_20px_48px_-40px_rgba(28,25,23,0.4)] ring-1 ring-stone-200/70 sm:p-6 lg:p-7">
            <div className="grid gap-8 lg:grid-cols-[1.1fr,1.75fr] lg:items-start">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-700">
                  <span className="h-2 w-2 rounded-full bg-primary-500" />
                  {t('footer.badge')}
                </span>
                <h2 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-stone-900">
                  SpondylAtlas
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-6 text-stone-600">
                  {isGerman
                    ? 'Privater Forschungs- und Community-Dienst mit datenschutzorientierter Struktur, Erwachsenenfokus und transparenter Moderation.'
                    : 'Private research and community service with a privacy-first structure, adult-only access, and transparent moderation.'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {trustPoints.map((point) => (
                    <span
                      key={point}
                      className="inline-flex rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-700"
                    >
                      {point}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <FooterColumn title={t('footer.navigation')}>
                  {primaryLinks.map((item) => (
                    <FooterLink key={item.to} to={item.to}>
                      {item.label}
                    </FooterLink>
                  ))}
                </FooterColumn>

                <FooterColumn title={t('footer.legal')}>
                  {PUBLIC_LEGAL_NAV.map((item) => (
                    <FooterLink key={item.path} to={item.path}>
                      {localize(i18n.language, item.label)}
                    </FooterLink>
                  ))}
                </FooterColumn>

                <FooterColumn title={t('footer.community')}>
                  {communityLinks.map((item) => (
                    <FooterLink key={item.to} to={item.to}>
                      {item.label}
                    </FooterLink>
                  ))}
                </FooterColumn>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 border-t border-stone-200 pt-4 text-sm text-stone-500 md:flex-row md:items-center md:justify-between">
              <p>&copy; {new Date().getFullYear()} SpondylAtlas</p>
              <p>{t('footer.bottom_note')}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FooterColumn({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">
        {title}
      </p>
      <div className="mt-3 flex flex-col gap-1.5">
        {children}
      </div>
    </div>
  )
}

function FooterLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-lg px-2.5 py-1.5 text-sm text-stone-600 transition duration-200 hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
    >
      {children}
    </Link>
  )
}
