import {
  collection, doc, addDoc, getDoc, getDocs,
  query, where, orderBy, limit, onSnapshot,
  serverTimestamp, increment, updateDoc, Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export type HypothesisStatus = 'pending_review' | 'open' | 'challenged' | 'needs_research'

export interface Hypothesis {
  id: string
  title: string
  description: string
  rationale: string
  paperIds: string[]
  status: HypothesisStatus
  generatedAt: Timestamp
  criticArgument?: string
  criticPaperIds?: string[]
  reviewedAt?: Timestamp
  commentCount?: number
}

export interface HypothesisComment {
  id: string
  hypothesisId: string
  content: string
  authorId: string
  authorName: string
  createdAt: Timestamp
}

const HYPO = 'hypotheses'
const COMMENTS = 'hypothesis_comments'

export async function getPublishedHypotheses(): Promise<Hypothesis[]> {
  const q = query(
    collection(db, HYPO),
    where('status', 'in', ['open', 'challenged']),
    orderBy('generatedAt', 'desc'),
    limit(50)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Hypothesis))
}

export async function getHypothesis(id: string): Promise<Hypothesis | null> {
  const snap = await getDoc(doc(db, HYPO, id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Hypothesis
}

export function subscribeHypotheses(cb: (h: Hypothesis[]) => void) {
  const q = query(
    collection(db, HYPO),
    where('status', 'in', ['open', 'challenged']),
    orderBy('generatedAt', 'desc'),
    limit(50)
  )
  return onSnapshot(q, snap =>
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Hypothesis)))
  )
}

export async function getComments(hypothesisId: string): Promise<HypothesisComment[]> {
  const q = query(
    collection(db, COMMENTS),
    where('hypothesisId', '==', hypothesisId),
    orderBy('createdAt', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as HypothesisComment))
}

export async function addComment(
  hypothesisId: string, content: string, authorId: string, authorName: string
): Promise<void> {
  await addDoc(collection(db, COMMENTS), {
    hypothesisId, content, authorId, authorName,
    createdAt: serverTimestamp(),
  })
  await updateDoc(doc(db, HYPO, hypothesisId), {
    commentCount: increment(1),
  })
}

export function formatTs(ts: Timestamp | null | undefined): string {
  if (!ts) return ''
  return ts.toDate().toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
