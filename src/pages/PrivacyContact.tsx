import { useTranslation } from 'react-i18next'
import LegalArticle from '../components/LegalArticle'
import { LEGAL_DOCUMENTS } from '../lib/legal'

export default function PrivacyContact() {
  const { i18n } = useTranslation()
  return <LegalArticle document={LEGAL_DOCUMENTS.privacyContact} language={i18n.language} />
}
