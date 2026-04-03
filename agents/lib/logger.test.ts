import { createLogger } from './logger.js'

function createDbDouble() {
  const adds: Array<Record<string, unknown>> = []
  const sets: Array<Record<string, unknown>> = []
  const updates: Array<Record<string, unknown>> = []

  return {
    adds,
    sets,
    updates,
    db: {
      collection: () => ({
        add: async (payload: Record<string, unknown>) => {
          adds.push(payload)
        },
        doc: () => ({
          set: async (payload: Record<string, unknown>) => {
            sets.push(payload)
          },
          update: async (payload: Record<string, unknown>) => {
            updates.push(payload)
          },
        }),
      }),
    },
  }
}

describe('createLogger', () => {
  it('writes start, event, complete, and error records', async () => {
    const { db, adds, sets, updates } = createDbDouble()
    const logger = createLogger('paper-search', db as never, 'run-1')

    await logger.logStart('Started')
    await logger.logEvent('step', 'Indexed')
    await logger.logComplete('Done', 3)
    await logger.logError('Boom')

    expect(sets[0]).toMatchObject({
      agent: 'paper-search',
      runId: 'run-1',
      status: 'running',
      summary: 'Started',
    })
    expect(adds).toHaveLength(4)
    expect(updates).toEqual([
      expect.objectContaining({ status: 'complete', itemsProcessed: 3, summary: 'Done' }),
      expect.objectContaining({ status: 'error', summary: 'Boom' }),
    ])
  })
})
