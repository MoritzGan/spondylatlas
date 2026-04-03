import {
  buildPaperRecord,
  cleanXmlText,
  dedupeBatch,
  extractTags,
  parseMonth,
  parsePubMedXml,
  runPaperSearch,
  sanitizeRecord,
} from './paper-search.js'

describe('paper-search helpers', () => {
  it('parses pubmed xml and normalizes values', () => {
    const xml = `
      <PubmedArticle>
        <PMID>123</PMID>
        <ArticleTitle>Study &amp; Title</ArticleTitle>
        <Abstract><AbstractText>One.</AbstractText><AbstractText>Two.</AbstractText></Abstract>
        <Author><LastName>Doe</LastName><Initials>J</Initials></Author>
        <PubDate><Year>2026</Year><Month>Mar</Month><Day>7</Day></PubDate>
        <ArticleId IdType="doi">10.1000/test</ArticleId>
      </PubmedArticle>`

    expect(parsePubMedXml(xml)).toEqual([
      expect.objectContaining({
        title: 'Study & Title',
        abstract: 'One. Two.',
        authors: ['Doe J'],
        publishedDate: '2026-03-07',
        pubmedId: '123',
        doi: '10.1000/test',
      }),
    ])
    expect(parseMonth('Sep')).toBe('09')
    expect(cleanXmlText('&lt;ok&gt;')).toBe('<ok>')
  })

  it('extracts tags, dedupes batch items and sanitizes records', () => {
    const papers = dedupeBatch([
      { title: 'A', abstract: '', authors: [], publishedDate: '2026-01-01', url: 'x', source: 'pubmed' as const, doi: 'doi-1' },
      { title: 'B', abstract: '', authors: [], publishedDate: '2026-01-01', url: 'x', source: 'europepmc' as const, doi: 'doi-1' },
    ])

    expect(papers).toHaveLength(1)
    expect(extractTags('TNF and microbiome', 'exercise')).toEqual(expect.arrayContaining(['TNF', 'Mikrobiom', 'Bewegung']))

    const record = sanitizeRecord(buildPaperRecord({
      title: 'Study',
      abstract: 'Abstract',
      authors: [],
      publishedDate: '2026-01-01',
      url: 'https://example.com',
      source: 'pubmed',
    }, 'Summary'))
    expect(record).not.toHaveProperty('doi')
  })

  it('runs the paper search pipeline with injected dependencies', async () => {
    const stored: Array<Record<string, unknown>> = []
    const logger = {
      logStart: vi.fn(),
      logEvent: vi.fn(),
      logComplete: vi.fn(),
    }
    const db = {
      collection: () => ({
        select: () => ({
          get: async () => ({ size: 0, docs: [] }),
        }),
        add: async (payload: Record<string, unknown>) => {
          stored.push(payload)
          return { id: 'paper-1' }
        },
      }),
    }
    const fetchFn = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ esearchresult: { idlist: ['123'] } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          resultList: { result: [] },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => `
          <PubmedArticle>
            <PMID>123</PMID>
            <ArticleTitle>Study</ArticleTitle>
            <Abstract><AbstractText>Abstract</AbstractText></Abstract>
            <PubDate><Year>2026</Year><Month>01</Month><Day>02</Day></PubDate>
          </PubmedArticle>`,
      })

    const anthropic = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Summary' }],
        }),
      },
    }

    const result = await runPaperSearch({
      db: db as never,
      anthropic: anthropic as never,
      logger,
      fetchFn,
    })

    expect(result.added).toBe(1)
    expect(stored[0]).toMatchObject({ title: 'Study', summary: 'Summary' })
    expect(logger.logComplete).toHaveBeenCalled()
  })
})
