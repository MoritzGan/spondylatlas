import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const CATEGORIES = [
  'general',
  'symptoms',
  'treatment',
  'exercise',
  'mental_health',
  'research_discussion',
] as const

export default function Forum() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">{t('forum.title')}</h1>
      <p className="mt-2 text-gray-600">{t('forum.subtitle')}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {CATEGORIES.map((category) => (
          <Link
            key={category}
            to={`/forum/${category}`}
            className="group rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-gray-900 group-hover:text-primary-700">
              {t(`forum.categories.${category}`)}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t('forum.thread_count', { count: 0 })}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
