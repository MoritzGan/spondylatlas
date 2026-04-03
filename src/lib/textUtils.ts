/**
 * Decodes common HTML entities in a string.
 */
export function decodeHtml(raw: string): string {
  return raw
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

/**
 * Entfernt KI-Prompt-Präfixe aus generierten Zusammenfassungen.
 *
 * Beispiele:
 *   "Zusammenfassung der wissenschaftlichen Studie in 3-4 Sätzen: Die Studie ..."
 *   → "Die Studie ..."
 *
 *   "Summary of the scientific study: This study ..."
 *   → "This study ..."
 *
 * Die Funktion wird iterativ angewendet, um verschachtelte Präfixe zu entfernen
 * (z. B. "Zusammenfassung: Analyse: Die Studie ...").
 */
export function stripAiPromptPrefix(text: string): string {
  const pattern = /^[A-Za-z\u00C0-\u024F][^:.]{0,120}:\s+/u
  let result = text.trim()
  let prev: string
  do {
    prev = result
    result = result.replace(pattern, '')
  } while (result !== prev && result.length > 0)
  return result
}
