import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function PaperDetail() {
  const { paperId } = useParams<{ paperId: string }>()
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/research" className="text-sm text-primary-600 hover:underline">
        &larr; {t('research.back_to_research')}
      </Link>

      <article className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('research.placeholder_title')} — {paperId}
        </h1>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
          <div>
            <span className="font-medium text-gray-700">{t('research.authors')}:</span> —
          </div>
          <div>
            <span className="font-medium text-gray-700">{t('research.published')}:</span> —
          </div>
          <div>
            <span className="font-medium text-gray-700">{t('research.source')}:</span> —
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-primary-100 px-3 py-0.5 text-xs font-medium text-primary-800">
            axSpA
          </span>
        </div>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">{t('research.summary')}</h2>
          <p className="mt-2 text-gray-700">{t('research.placeholder_abstract')}</p>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">{t('research.abstract')}</h2>
          <p className="mt-2 text-gray-700">{t('research.placeholder_abstract')}</p>
        </section>
      </article>
    </div>
  )
}
