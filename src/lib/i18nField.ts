import i18n from 'i18next'

/**
 * Resolve a Firestore field that may be either a plain string or
 * an i18n object `{ de: "...", en: "..." }` to the current locale string.
 */
export function localizeField(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, string>
    const lang = i18n.language?.slice(0, 2) ?? 'de'
    return obj[lang] ?? obj['de'] ?? obj['en'] ?? ''
  }
  return ''
}
