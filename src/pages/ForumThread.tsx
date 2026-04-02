import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function ForumThread() {
  const { threadId } = useParams<{ threadId: string }>()
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/forum" className="text-sm text-primary-600 hover:underline">
        &larr; {t('forum.back_to_forum')}
      </Link>

      <article className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('forum.placeholder_title')} — {threadId}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {t('forum.posted_by')} Anonymous
        </p>
        <div className="mt-4 text-gray-700">
          <p>{t('forum.placeholder_body')}</p>
        </div>
      </article>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('forum.replies', { count: 0 })}
        </h2>
        <p className="mt-4 text-gray-500">{t('forum.no_posts')}</p>
      </section>
    </div>
  )
}
