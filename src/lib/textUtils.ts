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

/**
 * Strips a leading markdown heading from patient summaries that duplicates
 * the UI section title (e.g. "## Zusammenfassung für medizinische Laien").
 * This heading is rendered via i18n instead, so we remove it from the content.
 */
export function stripLeadingSummaryHeading(text: string): string {
  return text.replace(
    /^#{1,3}\s*(Zusammenfassung\s+für\s+medizinische\s+Laien|Summary\s+for\s+patients)\s*\n+/i,
    '',
  )
}

/**
 * Entfernt grundlegende Markdown-Syntax für reine Textvorschauen.
 * Beispiel: "# Zusammenfassung\n\nText" → "Zusammenfassung Text"
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')   // Überschriften (#, ##, ...)
    .replace(/\*\*(.+?)\*\*/g, '$1') // Fett (**text**)
    .replace(/\*(.+?)\*/g, '$1')     // Kursiv (*text*)
    .replace(/`(.+?)`/g, '$1')       // Code (`code`)
    .replace(/!\[.*?\]\(.*?\)/g, '') // Bilder
    .replace(/\[(.+?)\]\(.*?\)/g, '$1') // Links
    .replace(/\n+/g, ' ')            // Zeilenumbrüche → Leerzeichen
    .trim()
}
