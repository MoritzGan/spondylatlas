import type { User } from 'firebase/auth'
import { getHealthDataConsent } from './compliance'

export async function hasActiveCommunityAccess(user: User | null): Promise<boolean> {
  if (!user?.emailVerified) {
    return false
  }

  const consent = await getHealthDataConsent(user.uid)
  return Boolean(consent?.granted)
}
