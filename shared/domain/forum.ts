export const FORUM_POST_STATUSES = [
  'pending_moderation',
  'published',
  'flagged',
  'removed',
] as const

export const FORUM_MODERATION_DECISIONS = ['approve', 'flag', 'remove'] as const

export const FORUM_CATEGORIES = [
  'general',
  'symptoms',
  'treatment',
  'exercise',
  'mental_health',
  'research_discussion',
] as const

export type ForumPostStatus = (typeof FORUM_POST_STATUSES)[number]
export type ForumModerationDecision = (typeof FORUM_MODERATION_DECISIONS)[number]
export type ForumCategory = (typeof FORUM_CATEGORIES)[number]

export const COMMUNITY_ACCESS_REQUIREMENTS = {
  requireVerifiedEmail: true,
  requireHealthDataConsent: true,
} as const

export function mapModerationDecisionToStatus(
  decision: ForumModerationDecision,
): Extract<ForumPostStatus, 'published' | 'flagged' | 'removed'> {
  switch (decision) {
    case 'approve':
      return 'published'
    case 'flag':
      return 'flagged'
    case 'remove':
      return 'removed'
  }
}
