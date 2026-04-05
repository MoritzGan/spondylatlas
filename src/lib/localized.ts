import i18n from "../i18n";

/**
 * Extract the localized string from a bilingual field.
 * Backward-compatible: if the field is a plain string (old data), returns it as-is.
 */
export function localized(field: string | { de: string; en: string } | undefined | null): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  const lang = i18n.language as "de" | "en";
  return field[lang] ?? field.de ?? field.en ?? "";
}
