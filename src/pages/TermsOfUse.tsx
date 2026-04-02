import { useTranslation } from 'react-i18next'
import LegalArticle from '../components/LegalArticle'
import { LEGAL_DOCUMENTS } from '../lib/legal'

export default function TermsOfUse() {
  const { i18n } = useTranslation()
  return <LegalArticle document={LEGAL_DOCUMENTS.terms} language={i18n.language} />
}
