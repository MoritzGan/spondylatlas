import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePageMeta } from '../hooks/usePageMeta'
import { HowItWorks } from '../components/HowItWorks'

export default function Landing() {
  const { t, i18n } = useTranslation()
  const isGerman = i18n.language.startsWith('de')
  const heroImageUrl = '/images/hero.webp'
  const logoImageUrl = '/images/logo.webp'

  usePageMeta({
    title: 'SpondylAtlas',
    description: isGerman
      ? 'Privater Forschungs- und Community-Dienst für Morbus Bechterew mit datenschutzorientierter Struktur.'
      : 'Private research and community service for ankylosing spondylitis with a privacy-first structure.',
  })

  return (
    <div>
      <section className="relative isolate overflow-hidden bg-stone-950 px-4 py-20 text-white md:py-28">
        <div className="absolute inset-0">
          <img
            src={heroImageUrl}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover object-[58%_34%]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(17,10,7,0.94)_6%,rgba(37,19,11,0.84)_38%,rgba(59,32,18,0.56)_62%,rgba(20,11,7,0.9)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_51%_43%,rgba(252,211,77,0.28),transparent_24%),radial-gradient(circle_at_80%_22%,rgba(255,247,237,0.18),transparent_30%)]" />
        </div>

        <div className="pointer-events-none absolute -right-12 bottom-0 hidden lg:block">
          <img
            src={logoImageUrl}
            alt=""
            aria-hidden="true"
            className="h-[30rem] w-[30rem] object-contain opacity-16 drop-shadow-[0_0_60px_rgba(251,191,36,0.35)]"
          />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-sm">
              <img src={logoImageUrl} alt="" aria-hidden="true" className="h-7 w-7 object-contain" />
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary-100 sm:text-sm">
                {t('landing.origin_label')}
              </p>
            </div>

            <h1 className="mt-8 font-serif text-5xl font-bold leading-tight tracking-tight text-white md:text-7xl">
              SpondylAtlas
            </h1>
            <p className="mt-5 text-xl text-primary-50 md:max-w-2xl md:text-2xl lg:mx-0">
              {t('landing.hero_subtitle')}
            </p>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-primary-100/90 lg:mx-0">
              {t('landing.hero_description')}
            </p>
            <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
              <Link
                to="/forum"
                className="rounded-full bg-white px-8 py-3.5 font-semibold text-primary-800 shadow-lg shadow-black/20 transition-all hover:bg-primary-50 hover:shadow-xl"
              >
                {t('landing.cta_forum')}
              </Link>
              <Link
                to="/research"
                className="rounded-full border-2 border-white/45 bg-white/8 px-8 py-3.5 font-semibold text-white backdrop-blur-sm transition-all hover:border-white hover:bg-white/14"
              >
                {t('landing.cta_research')}
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xs lg:mx-0 lg:justify-self-end">
            <div className="absolute inset-6 rounded-full bg-primary-300/25 blur-3xl" />
            <div className="relative rounded-[2rem] border border-white/15 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur-md">
              <div className="rounded-[1.5rem] border border-white/10 bg-black/15 p-5">
                <img
                  src={logoImageUrl}
                  alt="SpondylAtlas Logo"
                  className="mx-auto h-44 w-44 object-contain drop-shadow-[0_14px_30px_rgba(0,0,0,0.35)]"
                />
              </div>
              <p className="mt-5 text-center text-xs font-semibold uppercase tracking-[0.3em] text-primary-100/85">
                {isGerman ? 'Forschung trifft Community' : 'Research meets community'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <HowItWorks />

      <div className="mx-auto max-w-5xl border-t border-stone-200" />

      <section className="px-4 py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-semibold text-stone-800 md:text-4xl">
            {t('landing.mission_title')}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-stone-600">
            {t('landing.mission_text')}
          </p>
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          <FeatureCard
            icon={(
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            )}
            title={t('landing.feature_research')}
            description={t('landing.feature_research_desc')}
          />
          <FeatureCard
            icon={(
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            )}
            title={t('landing.feature_forum')}
            description={t('landing.feature_forum_desc')}
          />
          <FeatureCard
            icon={(
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            )}
            title={t('landing.feature_open')}
            description={t('landing.feature_open_desc')}
          />
        </div>
      </section>

      <section className="bg-primary-50 px-4 py-16 text-center">
        <h2 className="font-serif text-2xl font-semibold text-stone-800 md:text-3xl">
          {t('landing.cta_bottom_title')}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-stone-600">
          {t('landing.cta_bottom_text')}
        </p>
        <Link
          to="/register"
          className="mt-8 inline-block rounded-full bg-primary-600 px-8 py-3.5 font-semibold text-white shadow-md transition-all hover:bg-primary-700 hover:shadow-lg"
        >
          {t('landing.cta_join')}
        </Link>
      </section>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl border border-stone-100 bg-stone-50 p-7 text-center shadow-sm transition-shadow hover:shadow-md">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-700">
        {icon}
      </div>
      <h3 className="font-serif text-lg font-semibold text-stone-800">{title}</h3>
      <p className="mt-2 leading-relaxed text-stone-600">{description}</p>
    </div>
  )
}
