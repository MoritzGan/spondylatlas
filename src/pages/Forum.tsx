import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { getHealthDataConsent, grantHealthDataConsent } from '../lib/compliance'
import { usePageMeta } from '../hooks/usePageMeta'

const CATEGORIES = [
  'general',
  'symptoms',
  'treatment',
  'exercise',
  'mental_health',
  'research_discussion',
] as const

export default function Forum() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [loadingConsent, setLoadingConsent] = useState(true)
  const [hasConsent, setHasConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const isGerman = i18n.language.startsWith('de')

  usePageMeta({
    title: `${t('forum.title')} | SpondylAtlas`,
    description: isGerman
      ? 'Geschützter Community-Bereich mit E-Mail-Verifikation und dokumentierter Gesundheitsdaten-Einwilligung.'
      : 'Protected community area with email verification and documented health-data consent.',
    robots: 'noindex, nofollow',
  })

  useEffect(() => {
    const loadConsent = async () => {
      if (!user) {
        setLoadingConsent(false)
        return
      }

      try {
        const consent = await getHealthDataConsent(user.uid)
        setHasConsent(Boolean(consent?.granted))
      } finally {
        setLoadingConsent(false)
      }
    }

    void loadConsent()
  }, [user])

  async function handleGrantConsent() {
    if (!user) return

    setSubmitting(true)
    try {
      await grantHealthDataConsent(user)
      setHasConsent(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">{t('forum.title')}</h1>
      <p className="mt-2 text-gray-600">{t('forum.subtitle')}</p>

      <div className="mt-6 rounded-2xl border border-primary-200 bg-primary-50 p-5 text-sm leading-6 text-stone-700">
        {isGerman
          ? 'Die Community ist suchmaschinenabgeschirmt, nur für bestätigte Konten zugänglich und kann sensible gesundheitsbezogene Angaben enthalten. Vor dem Betreten ist eine dokumentierte Einwilligung erforderlich.'
          : 'The community is shielded from search engines, available only to verified accounts, and may contain sensitive health-related information. A documented consent is required before entry.'}
      </div>

      {loadingConsent ? (
        <div className="mt-8 text-sm text-stone-500">
          {isGerman ? 'Prüfe Community-Freigabe...' : 'Checking community access...'}
        </div>
      ) : !hasConsent ? (
        <div className="mt-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-stone-900">
            {isGerman ? 'Einwilligung für gesundheitsbezogene Community-Inhalte' : 'Consent for health-related community content'}
          </h2>
          <p className="mt-3 leading-7 text-stone-700">
            {isGerman
              ? 'Mit dem Betreten der Community bestätigst du, dass Beiträge sensible Angaben zu Erkrankungen, Symptomen, Behandlungen oder Belastungen enthalten können. Diese Einwilligung wird dokumentiert und kann später im Profil widerrufen werden.'
              : 'By entering the community, you confirm that posts may contain sensitive information about diseases, symptoms, treatments, or related burdens. This consent is recorded and can later be withdrawn in the profile area.'}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleGrantConsent()}
              disabled={submitting}
              className="rounded-xl bg-primary-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
            >
              {submitting
                ? isGerman ? 'Einwilligung wird gespeichert...' : 'Saving consent...'
                : isGerman ? 'Einwilligen und Community öffnen' : 'Consent and open community'}
            </button>
            <Link
              to="/community-regeln"
              className="rounded-xl border border-stone-300 px-5 py-2.5 font-medium text-stone-700 transition-colors hover:border-primary-400 hover:text-primary-700"
            >
              {isGerman ? 'Community-Regeln lesen' : 'Read community rules'}
            </Link>
          </div>
        </div>
      ) : null}

      {hasConsent && (
        <div className="mt-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-stone-500">
              {isGerman
                ? 'Moderationsentscheidungen werden dokumentiert. Verdächtige Inhalte können jederzeit gemeldet werden.'
                : 'Moderation decisions are documented. Suspected content can be reported at any time.'}
            </p>
            <Link to="/meldung" className="text-sm font-medium text-primary-700 hover:underline">
              {isGerman ? 'Inhalt melden' : 'Report content'}
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
      )}
    </div>
  )
}
