import type { Timestamp } from 'firebase/firestore'

export interface Paper {
  id: string
  title: string
  abstract: string
  summary: string
  authors: string[]
  publishedAt: Timestamp
  tags: string[]
  url: string
  source: string
  lang: 'de' | 'en'
}

export interface ForumThread {
  id: string
  title: string
  body: string
  authorId: string
  category: string
  lang: 'de' | 'en'
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface ForumPost {
  id: string
  threadId: string
  body: string
  authorId: string
  createdAt: Timestamp
  moderation_status: 'pending' | 'approved' | 'rejected'
}

export interface AppUser {
  id: string
  displayName: string
  lang: 'de' | 'en'
  role: 'user' | 'moderator' | 'admin'
  createdAt: Timestamp
}
