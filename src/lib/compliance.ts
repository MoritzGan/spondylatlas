import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from './firebase'
import { apiFetch } from './api'
import { LEGAL_VERSION } from './legal'

const USER_LEGAL_ACCEPTANCES = 'user_legal_acceptances'
const HEALTH_DATA_CONSENTS = 'health_data_consents'
const ACCOUNT_REQUESTS = 'account_requests'
const AUDIT_EVENTS = 'audit_events'
const USERS = 'users'

export async function createUserComplianceRecords(user: User, displayName: string, language: 'de' | 'en') {
  const batch = writeBatch(db)

  batch.set(doc(db, USERS, user.uid), {
    displayName,
    email: user.email,
    lang: language,
    role: 'user',
    ageConfirmed: true,
    legalVersion: LEGAL_VERSION,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true })

  batch.set(doc(db, USER_LEGAL_ACCEPTANCES, user.uid), {
    userId: user.uid,
    version: LEGAL_VERSION,
    acceptedAt: serverTimestamp(),
    documents: {
      privacy: true,
      storage: true,
      terms: true,
      communityRules: true,
      adultsOnly: true,
      healthRiskNotice: true,
    },
  }, { merge: true })

  batch.set(doc(db, AUDIT_EVENTS, `${user.uid}_registration_${Date.now()}`), {
    userId: user.uid,
    eventType: 'registration_completed',
    createdAt: serverTimestamp(),
    metadata: {
      version: LEGAL_VERSION,
      email: user.email,
    },
  })

  await batch.commit()
}

export async function getHealthDataConsent(userId: string) {
  const snapshot = await getDoc(doc(db, HEALTH_DATA_CONSENTS, userId))
  if (!snapshot.exists()) {
    return null
  }
  return snapshot.data() as {
    granted: boolean
    version: string
    grantedAt?: unknown
    revokedAt?: unknown
  }
}

export async function grantHealthDataConsent(user: User) {
  const batch = writeBatch(db)

  batch.set(doc(db, HEALTH_DATA_CONSENTS, user.uid), {
    userId: user.uid,
    version: LEGAL_VERSION,
    granted: true,
    grantedAt: serverTimestamp(),
    revokedAt: null,
    scope: 'community_forum',
  }, { merge: true })

  batch.set(doc(db, AUDIT_EVENTS, `${user.uid}_health_consent_${Date.now()}`), {
    userId: user.uid,
    eventType: 'health_data_consent_granted',
    createdAt: serverTimestamp(),
    metadata: {
      version: LEGAL_VERSION,
      scope: 'community_forum',
    },
  })

  await batch.commit()
}

export async function withdrawHealthDataConsent(user: User) {
  await Promise.all([
    updateDoc(doc(db, HEALTH_DATA_CONSENTS, user.uid), {
      granted: false,
      revokedAt: serverTimestamp(),
      version: LEGAL_VERSION,
    }),
    setDoc(doc(db, AUDIT_EVENTS, `${user.uid}_health_consent_withdrawn_${Date.now()}`), {
      userId: user.uid,
      eventType: 'health_data_consent_withdrawn',
      createdAt: serverTimestamp(),
      metadata: {
        version: LEGAL_VERSION,
        scope: 'community_forum',
      },
    }),
  ])
}

export async function submitAccountRequest(user: User, type: 'export' | 'delete') {
  await addDoc(collection(db, ACCOUNT_REQUESTS), {
    userId: user.uid,
    type,
    status: 'requested',
    createdAt: serverTimestamp(),
    version: LEGAL_VERSION,
  })

  await setDoc(doc(db, AUDIT_EVENTS, `${user.uid}_account_request_${type}_${Date.now()}`), {
    userId: user.uid,
    eventType: `account_request_${type}`,
    createdAt: serverTimestamp(),
    metadata: {
      version: LEGAL_VERSION,
    },
  })
}

export type ContentReportPayload = {
  reporterUserId?: string | null
  reporterEmail?: string
  contentUrl: string
  contentType: string
  reason: string
  details: string
}

export async function submitContentReport(payload: ContentReportPayload) {
  await apiFetch<{ id: string }>('/public/reports', {
    method: 'POST',
    optionalAuth: true,
    body: {
      contentUrl: payload.contentUrl,
      contentType: payload.contentType,
      reason: payload.reason,
      details: payload.details,
      reporterEmail: payload.reporterEmail?.trim() || '',
    },
  })
}
