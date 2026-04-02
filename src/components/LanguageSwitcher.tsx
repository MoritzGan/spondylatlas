import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  function toggle() {
    const next = i18n.language === 'de' ? 'en' : 'de'
    i18n.changeLanguage(next)
  }

  return (
    <button
      onClick={toggle}
      className="rounded-md border border-gray-300 px-2 py-1 text-sm font-medium text-gray-600 transition-colors hover:border-primary-400 hover:text-primary-700"
      aria-label="Switch language"
    >
      {i18n.language === 'de' ? 'EN' : 'DE'}
    </button>
  )
}
