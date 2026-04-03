import { parseModerationResponse, runForumModerator } from './forum-moderator.js'

describe('forum moderator', () => {
  it('falls back to flag when JSON parsing fails', () => {
    expect(parseModerationResponse('nope')).toEqual({
      decision: 'flag',
      reason: 'Parse-Fehler - manuelle Prüfung',
    })
  })

  it('maps moderation decisions to canonical statuses during a run', async () => {
    const updates: Array<Record<string, unknown>> = []
    const logger = {
      logStart: vi.fn(),
      logEvent: vi.fn(),
      logComplete: vi.fn(),
      logError: vi.fn(),
    }
    const db = {
      collection: (name: string) => ({
        where: () => ({
          orderBy: () => ({
            limit: () => ({
              get: async () => ({
                empty: false,
                size: 1,
                docs: name === 'forum_posts'
                  ? [{
                      id: 'post-1',
                      data: () => ({ title: 'Test', content: 'Body' }),
                      ref: { update: async (payload: Record<string, unknown>) => updates.push(payload) },
                    }]
                  : [],
              }),
            }),
          }),
          get: async () => ({
            empty: true,
            size: 0,
            docs: [],
          }),
        }),
      }),
    }
    const anthropic = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: '{"decision":"remove","reason":"Gefährlich"}' }],
        }),
      },
    }

    const result = await runForumModerator({
      db: db as never,
      anthropic: anthropic as never,
      logger,
    })

    expect(result.processedPosts).toBe(1)
    expect(updates[0]).toMatchObject({
      status: 'removed',
      moderationDecision: 'remove',
    })
  })
})
