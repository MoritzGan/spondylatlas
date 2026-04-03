import {
  collection, doc, getDoc, getDocs,
  query, orderBy,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Trial } from '../types/trials'

const TRIALS = 'trials'

export async function getTrials(): Promise<Trial[]> {
  const q = query(collection(db, TRIALS), orderBy('fetchedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Trial)
}

export async function getTrial(nctId: string): Promise<Trial | null> {
  const snap = await getDoc(doc(db, TRIALS, nctId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Trial
}
