import { useTranslation } from 'react-i18next'
import LegalArticle from '../components/LegalArticle'
import { LEGAL_DOCUMENTS } from '../lib/legal'

export default function PrivacyPolicy() {
  const { i18n } = useTranslation()
  return <LegalArticle document={LEGAL_DOCUMENTS.privacy} language={i18n.language} />
}
