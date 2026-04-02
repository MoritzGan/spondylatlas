import { Timestamp } from 'firebase/firestore'

export type ForumCategory =
  | 'general'
  | 'symptoms'
  | 'treatment'
  | 'exercise'
  | 'mental_health'
  | 'research_discussion'

export type PostStatus = 'pending_moderation' | 'published' | 'rejected' | 'deleted'

export interface ForumPost {
  id: string
  title: string
  content: string
  category: ForumCategory
  authorId: string
  authorName: string
  status: PostStatus
  createdAt: Timestamp
  updatedAt: Timestamp
  replyCount: number
  lastReplyAt: Timestamp | null
}

export interface ForumComment {
  id: string
  postId: string
  content: string
  authorId: string
  authorName: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
