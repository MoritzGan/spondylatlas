import { useTranslation } from 'react-i18next'

type LanguageSwitcherProps = {
  variant?: 'desktop' | 'mobile'
}

export default function LanguageSwitcher({ variant = 'desktop' }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation()

  function toggle() {
    const next = i18n.language === 'de' ? 'en' : 'de'
    void i18n.changeLanguage(next)
  }

  const isMobile = variant === 'mobile'
  const currentLabel = i18n.language === 'de' ? 'DE' : 'EN'
  const nextLabel = i18n.language === 'de' ? 'EN' : 'DE'

  return (
    <button
      type="button"
      onClick={toggle}
      className={
        isMobile
          ? 'flex w-full items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-left text-sm font-medium text-stone-700 transition duration-200 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40'
          : 'inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-2.5 py-2 text-sm font-medium text-stone-700 shadow-sm transition duration-200 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40'
      }
      aria-label={t('nav.language_switcher_label', { language: nextLabel })}
      title={t('nav.language_switcher_label', { language: nextLabel })}
    >
      <span className={isMobile ? 'text-sm font-semibold text-stone-900' : 'flex items-center gap-2'}>
        {isMobile ? (
          t('nav.language')
        ) : (
          <>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 text-[11px] font-semibold tracking-[0.18em] text-stone-500">
              {currentLabel}
            </span>
            <span className="text-xs uppercase tracking-[0.22em] text-stone-500">{t('nav.language')}</span>
          </>
        )}
      </span>
      <span
        className={
          isMobile
            ? 'inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-700 shadow-sm'
            : 'inline-flex items-center rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-700'
        }
      >
        {nextLabel}
      </span>
    </button>
  )
}
