import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Landing() {
  const { t } = useTranslation()

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-accent-600 px-4 py-20 text-white md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            {t('landing.hero_title')}
          </h1>
          <p className="mt-4 text-lg text-primary-100 md:text-xl">
            {t('landing.hero_subtitle')}
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-primary-200">
            {t('landing.hero_description')}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/forum"
              className="rounded-lg bg-white px-6 py-3 font-semibold text-primary-700 shadow-lg transition-colors hover:bg-primary-50"
            >
              {t('landing.cta_forum')}
            </Link>
            <Link
              to="/research"
              className="rounded-lg border-2 border-white/30 px-6 py-3 font-semibold text-white transition-colors hover:border-white hover:bg-white/10"
            >
              {t('landing.cta_research')}
            </Link>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
            {t('landing.mission_title')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            {t('landing.mission_text')}
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white px-4 py-16">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          <FeatureCard
            icon={
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            }
            title={t('landing.feature_research')}
            description={t('landing.feature_research_desc')}
          />
          <FeatureCard
            icon={
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            }
            title={t('landing.feature_forum')}
            description={t('landing.feature_forum_desc')}
          />
          <FeatureCard
            icon={
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
              </svg>
            }
            title={t('landing.feature_open')}
            description={t('landing.feature_open_desc')}
          />
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-700">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-gray-600">{description}</p>
    </div>
  )
}
