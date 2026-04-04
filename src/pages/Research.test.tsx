import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { buildPaper } from '../../tests/fixtures/builders'
import Research from './Research'

const getDocsMock = vi.fn()
const collectionMock = vi.fn()
const queryMock = vi.fn()
const orderByMock = vi.fn()

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore')
  return {
    ...actual,
    collection: (...args: unknown[]) => collectionMock(...args),
    getDocs: (...args: unknown[]) => getDocsMock(...args),
    query: (...args: unknown[]) => queryMock(...args),
    orderBy: (...args: unknown[]) => orderByMock(...args),
  }
})

vi.mock('../lib/firebase', () => ({
  db: {},
}))

vi.mock('../hooks/usePageMeta', () => ({
  usePageMeta: vi.fn(),
}))

describe('Research page', () => {
  beforeEach(() => {
    collectionMock.mockReturnValue('papers-collection')
    orderByMock.mockReturnValue('published-order')
    queryMock.mockReturnValue('papers-query')
  })

  it('loads papers and filters by search term', async () => {
    const user = userEvent.setup()
    getDocsMock.mockResolvedValue({
      docs: [
        { id: 'paper-1', data: () => buildPaper({ title: 'Alpha TNF study' }) },
        { id: 'paper-2', data: () => buildPaper({ id: 'paper-2', title: 'Beta microbiome trial', tags: ['Mikrobiom'] }) },
      ],
    })

    render(
      <MemoryRouter>
        <Research />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Alpha TNF study')).toBeInTheDocument()
    expect(screen.getByText('Beta microbiome trial')).toBeInTheDocument()

    await user.type(screen.getByRole('searchbox'), 'mikrobiom')

    await waitFor(() => {
      expect(screen.queryByText('Alpha TNF study')).not.toBeInTheDocument()
      expect(screen.getByText('Beta microbiome trial')).toBeInTheDocument()
    })
  })

  it('filters by multiple search terms (AND logic)', async () => {
    const user = userEvent.setup()
    getDocsMock.mockResolvedValue({
      docs: [
        { id: 'paper-1', data: () => buildPaper({ title: 'TNF inhibitors in AS', tags: ['TNF', 'Biologika'] }) },
        { id: 'paper-2', data: () => buildPaper({ id: 'paper-2', title: 'Mikrobiom und Darm', tags: ['Mikrobiom'] }) },
        { id: 'paper-3', data: () => buildPaper({ id: 'paper-3', title: 'TNF und Mikrobiom', tags: ['TNF'] }) },
      ],
    })

    render(
      <MemoryRouter>
        <Research />
      </MemoryRouter>,
    )

    expect(await screen.findByText('TNF inhibitors in AS')).toBeInTheDocument()

    await user.type(screen.getByRole('searchbox'), 'TNF Biologika')

    await waitFor(() => {
      expect(screen.getByText('TNF inhibitors in AS')).toBeInTheDocument()
      expect(screen.queryByText('Mikrobiom und Darm')).not.toBeInTheDocument()
      expect(screen.queryByText('TNF und Mikrobiom')).not.toBeInTheDocument()
    })
  })

    it('renders fetch errors', async () => {
    getDocsMock.mockRejectedValue(new Error('boom'))

    render(
      <MemoryRouter>
        <Research />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Fehler: boom')).toBeInTheDocument()
  })
})
