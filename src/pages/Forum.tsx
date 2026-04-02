import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getCategoryStats } from '../lib/forum'
import type { ForumCategory } from '../types/forum'

const CATEGORIES: ForumCategory[] = [
  'general',
  'symptoms',
  'treatment',
  'exercise',
  'mental_health',
  'research_discussion',
]

const CATEGORY_ICONS: Record<ForumCategory, string> = {
  general: '',
  symptoms: '',
  treatment: '',
  exercise: '',
  mental_health: '',
  research_discussion: '',
}

export default function Forum() {
  const { t } = useTranslation()
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCategoryStats()
      .then(setCounts)
      .finally(() => setLoading(false))
  }, [])

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
            <div className="flex items-center gap-3">
              <span className="text-2xl">{CATEGORY_ICONS[category]}</span>
              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-primary-700">
                {t(`forum.categories.${category}`)}
              </h2>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {loading
                ? '…'
                : t('forum.thread_count', { count: counts[category] ?? 0 })}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
