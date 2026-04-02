import { useTranslation } from 'react-i18next'
import LegalArticle from '../components/LegalArticle'
import { LEGAL_DOCUMENTS, STORAGE_INVENTORY, localize } from '../lib/legal'

export default function StorageNotice() {
  const { i18n } = useTranslation()
  const document = LEGAL_DOCUMENTS.storage
  const language = i18n.language

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <LegalArticle document={document} language={language} />

      <div className="mx-auto mt-6 max-w-4xl rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-stone-900">
          {language.startsWith('de') ? 'Speicherinventar' : 'Storage inventory'}
        </h2>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500">
                <th className="px-3 py-3 font-medium">{language.startsWith('de') ? 'Element' : 'Item'}</th>
                <th className="px-3 py-3 font-medium">{language.startsWith('de') ? 'Typ' : 'Type'}</th>
                <th className="px-3 py-3 font-medium">{language.startsWith('de') ? 'Zweck' : 'Purpose'}</th>
                <th className="px-3 py-3 font-medium">{language.startsWith('de') ? 'Dauer' : 'Lifetime'}</th>
              </tr>
            </thead>
            <tbody>
              {STORAGE_INVENTORY.map((entry) => (
                <tr key={entry.key} className="border-b border-stone-100 align-top text-stone-700">
                  <td className="px-3 py-4 font-medium text-stone-900">{localize(language, entry.name)}</td>
                  <td className="px-3 py-4">{localize(language, entry.storage)}</td>
                  <td className="px-3 py-4 leading-6">{localize(language, entry.purpose)}</td>
                  <td className="px-3 py-4">{localize(language, entry.lifetime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
