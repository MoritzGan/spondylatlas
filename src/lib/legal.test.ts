import {
  COMMUNITY_ACCESS_REQUIREMENTS,
  mapModerationDecisionToStatus,
} from '../../shared/domain/forum'
import { isGermanLanguage, LEGAL_DOCUMENTS, localize, STORAGE_INVENTORY } from './legal'

describe('legal helpers', () => {
  it('localizes german and english content', () => {
    expect(localize('de-DE', { de: 'Hallo', en: 'Hello' })).toBe('Hallo')
    expect(localize('en-US', { de: 'Hallo', en: 'Hello' })).toBe('Hello')
    expect(isGermanLanguage('de')).toBe(true)
    expect(isGermanLanguage('en')).toBe(false)
  })

  it('exposes legal inventory and canonical community defaults', () => {
    expect(LEGAL_DOCUMENTS.privacy.path).toBe('/datenschutz')
    expect(STORAGE_INVENTORY).toHaveLength(3)
    expect(COMMUNITY_ACCESS_REQUIREMENTS.requireVerifiedEmail).toBe(true)
    expect(mapModerationDecisionToStatus('flag')).toBe('flagged')
  })
})
