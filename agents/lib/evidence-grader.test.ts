import { mergeTags, parseEvidenceResponse, runEvidenceGrader, selectPapersToGrade } from './evidence-grader.js'

describe('evidence grader', () => {
  it('parses model responses and merges tags without duplicates', () => {
    expect(parseEvidenceResponse('{"level":"1b","studyType":"RCT","confidence":"high","rationale":"ok","tags":["TNF"]}')).toMatchObject({
      level: '1b',
      studyType: 'RCT',
    })
    expect(mergeTags(['TNF'], ['TNF', 'IL-17'])).toEqual(['TNF', 'IL-17'])
  })

  it('selects ungraded papers and updates them during a run', async () => {
    const updated: Array<Record<string, unknown>> = []
    const docs = [
      { id: '1', data: () => ({ title: 'Done', evidenceLevel: '1a' }), ref: { update: vi.fn() } },
      { id: '2', data: () => ({ title: 'Todo', abstract: 'A', tags: ['TNF'] }), ref: { update: async (payload: Record<string, unknown>) => updated.push(payload) } },
    ]
    expect(selectPapersToGrade(docs as never)).toHaveLength(1)

    const logger = {
      logStart: vi.fn(),
      logEvent: vi.fn(),
      logComplete: vi.fn(),
      logError: vi.fn(),
    }

    const db = {
      collection: () => ({
        orderBy: () => ({
          limit: () => ({
            get: async () => ({ docs }),
          }),
        }),
      }),
    }

    const anthropic = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: '{"level":"2b","studyType":"Cohort","confidence":"medium","rationale":"ok","tags":["IL-17"]}' }],
        }),
      },
    }

    const result = await runEvidenceGrader({
      db: db as never,
      anthropic: anthropic as never,
      logger,
    })

    expect(result).toEqual({ graded: 1, total: 1 })
    expect(updated[0]).toMatchObject({
      evidenceLevel: '2b',
      tags: ['TNF', 'IL-17'],
    })
  })
})
