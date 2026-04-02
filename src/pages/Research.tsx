import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Research() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">{t('research.title')}</h1>
      <p className="mt-2 text-gray-600">{t('research.subtitle')}</p>

      <div className="mt-6">
        <input
          type="search"
          placeholder={t('research.search_placeholder')}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
      </div>

      <div className="mt-8">
        {/* Placeholder paper card */}
        <Link
          to="/research/example-paper"
          className="block rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-gray-900">{t('research.placeholder_title')}</h2>
          <p className="mt-2 text-gray-600">{t('research.placeholder_abstract')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-primary-100 px-3 py-0.5 text-xs font-medium text-primary-800">
              axSpA
            </span>
            <span className="rounded-full bg-primary-100 px-3 py-0.5 text-xs font-medium text-primary-800">
              Biologika
            </span>
          </div>
        </Link>
      </div>
    </div>
  )
}
