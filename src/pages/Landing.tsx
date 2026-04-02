import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePageMeta } from '../hooks/usePageMeta'

export default function Landing() {
  const { t, i18n } = useTranslation()
  const isGerman = i18n.language.startsWith('de')

  usePageMeta({
    title: 'SpondylAtlas',
    description: isGerman
      ? 'Privater Forschungs- und Community-Dienst für Morbus Bechterew mit datenschutzorientierter Struktur.'
      : 'Private research and community service for ankylosing spondylitis with a privacy-first structure.',
  })

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-accent-700 px-4 py-24 text-white md:py-36">
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
        />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-primary-200">
            {t('landing.origin_label')}
          </p>
          <h1 className="font-serif text-5xl font-bold leading-tight tracking-tight md:text-7xl">
            SpondylAtlas
          </h1>
          <p className="mt-5 text-xl text-primary-100 md:text-2xl">
            {t('landing.hero_subtitle')}
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-primary-200">
            {t('landing.hero_description')}
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/forum"
              className="rounded-full bg-white px-8 py-3.5 font-semibold text-primary-800 shadow-lg transition-all hover:bg-primary-50 hover:shadow-xl"
            >
              {t('landing.cta_forum')}
            </Link>
            <Link
              to="/research"
              className="rounded-full border-2 border-white/40 px-8 py-3.5 font-semibold text-white transition-all hover:border-white hover:bg-white/10"
            >
              {t('landing.cta_research')}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-stone-200 bg-stone-100 px-4 py-10">
        <div className="mx-auto max-w-5xl rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary-700">
            {isGerman ? 'Compliance by design' : 'Compliance by design'}
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-stone-900">
            {isGerman
              ? 'Öffentliche Forschung, geschützte Community'
              : 'Public research, protected community'}
          </h2>
          <div className="mt-4 grid gap-4 text-sm leading-6 text-stone-700 md:grid-cols-3">
            <div className="rounded-2xl bg-stone-50 p-4">
              {isGerman
                ? 'Die Forschung ist öffentlich erreichbar. Community-Inhalte bleiben hinter Login, E-Mail-Bestätigung und dokumentierter Einwilligung.'
                : 'Research remains publicly accessible. Community content stays behind login, email verification, and documented consent.'}
            </div>
            <div className="rounded-2xl bg-stone-50 p-4">
              {isGerman
                ? 'Zum Start werden keine Analyse- oder Marketing-Cookies eingesetzt. Nur technisch erforderliche Speicherungen bleiben aktiv.'
                : 'At launch, no analytics or marketing cookies are used. Only technically necessary storage remains active.'}
            </div>
            <div className="rounded-2xl bg-stone-50 p-4">
              {isGerman
                ? 'Rechtsdokumente, Meldeweg und Datenschutzkontakt sind dauerhaft im Footer erreichbar.'
                : 'Legal documents, reporting flow, and privacy contact are permanently available in the footer.'}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-medium text-primary-800">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              {t('landing.how_badge')}
            </span>
          </div>
          <h2 className="text-center font-serif text-3xl font-semibold text-stone-800 md:text-4xl">
            {t('landing.how_title')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg leading-relaxed text-stone-600">
            {t('landing.how_intro')}
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <HowStep number="01" title={t('landing.how_step1_title')} text={t('landing.how_step1_text')} />
            <HowStep number="02" title={t('landing.how_step2_title')} text={t('landing.how_step2_text')} />
            <HowStep number="03" title={t('landing.how_step3_title')} text={t('landing.how_step3_text')} />
            <HowStep number="04" title={t('landing.how_step4_title')} text={t('landing.how_step4_text')} accent />
          </div>
        </div>
      </section>

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

function HowStep({
  number,
  title,
  text,
  accent = false,
}: {
  number: string
  title: string
  text: string
  accent?: boolean
}) {
  return (
    <div className={`rounded-2xl p-7 ${accent ? 'border border-primary-200 bg-primary-50' : 'border border-stone-100 bg-stone-50'} shadow-sm`}>
      <span className={`text-sm font-semibold tracking-widest ${accent ? 'text-primary-600' : 'text-stone-400'}`}>{number}</span>
      <h3 className="mt-2 font-serif text-xl font-semibold text-stone-800">{title}</h3>
      <p className="mt-2 leading-relaxed text-stone-600">{text}</p>
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
