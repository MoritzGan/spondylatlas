import { Link, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from './Navbar'
import { PUBLIC_LEGAL_NAV, localize } from '../lib/legal'

export default function Layout() {
  const { i18n } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-stone-200 bg-white py-10">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-[1.2fr,1fr,1fr]">
          <div>
            <p className="text-lg font-semibold text-stone-900">SpondylAtlas</p>
            <p className="mt-3 max-w-md text-sm leading-6 text-stone-600">
              {i18n.language.startsWith('de')
                ? 'Privater Forschungs- und Community-Dienst mit datenschutzorientierter Struktur, Erwachsenenfokus und transparenter Moderation.'
                : 'Private research and community service with a privacy-first structure, adult-only access, and transparent moderation.'}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
              {i18n.language.startsWith('de') ? 'Rechtliches' : 'Legal'}
            </p>
            <div className="mt-4 flex flex-col gap-2 text-sm text-stone-600">
              {PUBLIC_LEGAL_NAV.map((item) => (
                <Link key={item.path} to={item.path} className="hover:text-primary-700">
                  {localize(i18n.language, item.label)}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
              {i18n.language.startsWith('de') ? 'Community' : 'Community'}
            </p>
            <div className="mt-4 flex flex-col gap-2 text-sm text-stone-600">
              <Link to="/research" className="hover:text-primary-700">
                {i18n.language.startsWith('de') ? 'Forschung' : 'Research'}
              </Link>
              <Link to="/forum" className="hover:text-primary-700">
                {i18n.language.startsWith('de') ? 'Geschützte Community' : 'Protected community'}
              </Link>
              <Link to="/profile" className="hover:text-primary-700">
                {i18n.language.startsWith('de') ? 'Profil & Rechte' : 'Profile & rights'}
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-6xl border-t border-stone-200 px-4 pt-6 text-sm text-stone-500">
          &copy; {new Date().getFullYear()} SpondylAtlas
        </div>
      </footer>
    </div>
  )
}
