import { localize, type LegalDocument } from '../lib/legal'
import { usePageMeta } from '../hooks/usePageMeta'

export default function LegalArticle({ document, language }: { document: LegalDocument; language: string }) {
  const title = `${localize(language, document.title)} | SpondylAtlas`
  const description = localize(language, document.summary)

  usePageMeta({ title, description })

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary-700">
          {localize(language, document.label)}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-900">
          {localize(language, document.title)}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
          {description}
        </p>
        <p className="mt-4 text-xs uppercase tracking-[0.18em] text-stone-400">
          {language.startsWith('de') ? 'Version / Stand' : 'Version / Last updated'}: {document.lastUpdated}
        </p>

        <div className="mt-8 space-y-8">
          {document.sections.map((section) => (
            <section key={localize(language, section.title)} className="border-t border-stone-200 pt-6 first:border-t-0 first:pt-0">
              <h2 className="text-xl font-semibold text-stone-900">
                {localize(language, section.title)}
              </h2>

              {section.paragraphs?.map((paragraph) => (
                <p key={localize(language, paragraph)} className="mt-3 leading-7 text-stone-700">
                  {localize(language, paragraph)}
                </p>
              ))}

              {section.bullets && section.bullets.length > 0 && (
                <ul className="mt-4 space-y-3 text-stone-700">
                  {section.bullets.map((bullet) => (
                    <li key={localize(language, bullet)} className="flex gap-3 leading-7">
                      <span className="mt-2 h-2 w-2 rounded-full bg-primary-500" />
                      <span>{localize(language, bullet)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
