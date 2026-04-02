import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePageMeta } from '../hooks/usePageMeta'

export default function ForumThread() {
  const { threadId } = useParams<{ threadId: string }>()
  const { t, i18n } = useTranslation()
  const isGerman = i18n.language.startsWith('de')

  usePageMeta({
    title: `${t('forum.placeholder_title')} | SpondylAtlas`,
    robots: 'noindex, nofollow',
    description: isGerman
      ? 'Geschützter Thread im privaten Community-Bereich.'
      : 'Protected thread within the private community area.',
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/forum" className="text-sm text-primary-600 hover:underline">
        &larr; {t('forum.back_to_forum')}
      </Link>

      <article className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <div className="rounded-2xl bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-600">
          {isGerman
            ? 'Dieser Bereich ist nicht für Suchmaschinen bestimmt. Community-Inhalte können sensible gesundheitsbezogene Angaben enthalten.'
            : 'This area is not intended for search engines. Community content may contain sensitive health-related information.'}
        </div>

        <h1 className="mt-5 text-2xl font-bold text-gray-900">
          {t('forum.placeholder_title')} - {threadId}
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
