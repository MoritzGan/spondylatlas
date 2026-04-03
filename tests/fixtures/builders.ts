import { Timestamp } from 'firebase/firestore'
import type { AgentEvent, AgentRun } from '../../src/lib/agentArena'
import type { Paper } from '../../src/lib/types'
import type { Hypothesis } from '../../src/lib/hypotheses'
import type { ForumComment, ForumPost } from '../../src/types/forum'

export function timestampFromIso(iso = '2026-04-03T10:00:00.000Z') {
  return Timestamp.fromDate(new Date(iso))
}

export function buildPaper(overrides: Partial<Paper> = {}): Paper {
  return {
    id: 'paper-1',
    title: 'Alpha study',
    abstract: 'Abstract about ankylosing spondylitis.',
    summary: 'Summary of the scientific study: Helpful result.',
    authors: ['Doe J'],
    publishedAt: timestampFromIso(),
    tags: ['TNF'],
    url: 'https://example.com/paper-1',
    source: 'pubmed',
    lang: 'de',
    ...overrides,
  }
}

export function buildForumPost(overrides: Partial<ForumPost> = {}): ForumPost {
  return {
    id: 'post-1',
    title: 'Topic',
    content: 'Protected forum content',
    category: 'general',
    authorId: 'user-1',
    authorName: 'Alex',
    status: 'published',
    createdAt: timestampFromIso(),
    updatedAt: timestampFromIso(),
    replyCount: 0,
    lastReplyAt: null,
    ...overrides,
  }
}

export function buildForumComment(overrides: Partial<ForumComment> = {}): ForumComment {
  return {
    id: 'comment-1',
    postId: 'post-1',
    content: 'Reply',
    authorId: 'user-1',
    authorName: 'Alex',
    createdAt: timestampFromIso(),
    updatedAt: timestampFromIso(),
    ...overrides,
  }
}

export function buildHypothesis(overrides: Partial<Hypothesis> = {}): Hypothesis {
  return {
    id: 'hypothesis-1',
    title: 'Gut inflammation hypothesis',
    description: 'Description',
    rationale: 'Rationale',
    paperIds: ['paper-1'],
    status: 'open',
    generatedAt: timestampFromIso(),
    commentCount: 0,
    ...overrides,
  }
}

export function buildAgentEvent(overrides: Partial<AgentEvent> = {}): AgentEvent {
  return {
    id: 'event-1',
    agent: 'paper-search',
    runId: 'run-1',
    type: 'step',
    message: 'Indexed paper',
    detail: null,
    timestamp: timestampFromIso(),
    ...overrides,
  }
}

export function buildAgentRun(overrides: Partial<AgentRun> = {}): AgentRun {
  return {
    id: 'run-1',
    agent: 'paper-search',
    runId: 'run-1',
    status: 'complete',
    startedAt: timestampFromIso(),
    completedAt: timestampFromIso('2026-04-03T10:01:00.000Z'),
    itemsProcessed: 2,
    summary: 'Done',
    ...overrides,
  }
}
