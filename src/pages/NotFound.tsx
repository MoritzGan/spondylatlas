import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePageMeta } from '../hooks/usePageMeta'

export default function NotFound() {
  const { t } = useTranslation()

  usePageMeta({
    title: '404 | SpondylAtlas',
    robots: 'noindex, nofollow',
  })

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-primary-600">404</h1>
      <p className="mt-4 text-xl text-stone-900">{t('common.not_found')}</p>
      <p className="mt-2 text-stone-600">{t('common.not_found_desc')}</p>
      <Link
        to="/"
        className="mt-8 rounded-lg bg-primary-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-primary-700"
      >
        {t('common.back_home')}
      </Link>
    </div>
  )
}
