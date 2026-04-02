import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { ForumPost, ForumComment, ForumCategory } from '../types/forum'

const POSTS = 'forum_posts'
const COMMENTS = 'forum_comments'

// ── Posts ────────────────────────────────────────────────────────────────────

export async function createPost(
  title: string,
  content: string,
  category: ForumCategory,
  authorId: string,
  authorName: string,
): Promise<string> {
  const ref = await addDoc(collection(db, POSTS), {
    title,
    content,
    category,
    authorId,
    authorName,
    status: 'published', // simplified: no moderation queue for MVP
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    replyCount: 0,
    lastReplyAt: null,
  })
  return ref.id
}

export async function getPostsByCategory(category: ForumCategory): Promise<ForumPost[]> {
  const q = query(
    collection(db, POSTS),
    where('category', '==', category),
    where('status', '==', 'published'),
    orderBy('createdAt', 'desc'),
    limit(50),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ForumPost))
}

export async function getPost(postId: string): Promise<ForumPost | null> {
  const snap = await getDoc(doc(db, POSTS, postId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as ForumPost
}

export async function getCategoryStats(): Promise<Record<string, number>> {
  const q = query(collection(db, POSTS), where('status', '==', 'published'))
  const snap = await getDocs(q)
  const counts: Record<string, number> = {}
  snap.docs.forEach((d) => {
    const cat = d.data().category as string
    counts[cat] = (counts[cat] ?? 0) + 1
  })
  return counts
}

// ── Comments ─────────────────────────────────────────────────────────────────

export async function addComment(
  postId: string,
  content: string,
  authorId: string,
  authorName: string,
): Promise<string> {
  const ref = await addDoc(collection(db, COMMENTS), {
    postId,
    content,
    authorId,
    authorName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  // increment reply counter on the post
  await updateDoc(doc(db, POSTS, postId), {
    replyCount: increment(1),
    lastReplyAt: serverTimestamp(),
  })
  return ref.id
}

export async function getComments(postId: string): Promise<ForumComment[]> {
  const q = query(
    collection(db, COMMENTS),
    where('postId', '==', postId),
    orderBy('createdAt', 'asc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ForumComment))
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function formatDate(ts: Timestamp | null): string {
  if (!ts) return ''
  return ts.toDate().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
