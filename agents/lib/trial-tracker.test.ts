import { mapStudyToTrial, runTrialTracker } from './trial-tracker.js'

describe('trial tracker', () => {
  it('maps raw trial studies to stored trial objects', () => {
    const raw = {
      protocolSection: {
        identificationModule: { nctId: 'NCT1', briefTitle: 'Study' },
        descriptionModule: { briefSummary: 'Summary' },
        statusModule: {
          overallStatus: 'RECRUITING',
          startDateStruct: { date: '2026-01-01' },
          primaryCompletionDateStruct: { date: '2026-12-31' },
        },
        designModule: {
          phases: ['PHASE3'],
          enrollmentInfo: { count: 50 },
        },
        contactsLocationsModule: { locations: [{ city: 'Berlin', country: 'Germany' }] },
        armsInterventionsModule: { interventions: [{ name: 'Drug A' }] },
      },
    }

    expect(mapStudyToTrial(raw, 'Kurzfassung')).toMatchObject({
      nctId: 'NCT1',
      title: 'Study',
      status: 'RECRUITING',
      interventions: ['Drug A'],
      summaryDe: 'Kurzfassung',
    })
  })

  it('stores only new trials', async () => {
    const stored: Array<{ id: string; data: unknown }> = []
    const logger = {
      logStart: vi.fn(),
      logEvent: vi.fn(),
      logComplete: vi.fn(),
      logError: vi.fn(),
    }
    const db = {
      collection: () => ({
        select: () => ({
          get: async () => ({ docs: [{ data: () => ({ nctId: 'NCT-OLD' }) }] }),
        }),
        doc: (id: string) => ({
          set: async (data: unknown) => {
            stored.push({ id, data })
          },
        }),
      }),
    }
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        studies: [
          { protocolSection: { identificationModule: { nctId: 'NCT-OLD', briefTitle: 'Old' } } },
          { protocolSection: { identificationModule: { nctId: 'NCT-NEW', briefTitle: 'New' }, descriptionModule: { briefSummary: 'Desc' } } },
        ],
      }),
    })
    const anthropic = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Kurzfassung' }],
        }),
      },
    }

    const result = await runTrialTracker({
      db: db as never,
      anthropic: anthropic as never,
      logger,
      fetchFn,
    })

    expect(result).toEqual({ added: 1 })
    expect(stored[0].id).toBe('NCT-NEW')
  })
})
