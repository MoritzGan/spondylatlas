/**
 * Resolve an i18n field that may be stored as either a plain string
 * or a localised object `{ de: "…", en: "…" }` in Firestore.
 *
 * Returns a plain string, preferring `de` when an object is given.
 */
export function resolveI18n(
  value: string | Record<string, string> | undefined | null,
  locale: "de" | "en" = "de",
): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return value[locale] ?? value.de ?? value.en ?? "";
  }
  return String(value);
}
