import { Timestamp } from 'firebase/firestore'
import type { ForumCategory, ForumPostStatus } from '../../shared/domain/forum'

export type { ForumCategory }
export type PostStatus = ForumPostStatus

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
