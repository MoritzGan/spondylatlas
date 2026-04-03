import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { buildPaper } from '../../tests/fixtures/builders'
import PaperDetail from './PaperDetail'

const docMock = vi.fn()
const getDocMock = vi.fn()

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore')
  return {
    ...actual,
    doc: (...args: unknown[]) => docMock(...args),
    getDoc: (...args: unknown[]) => getDocMock(...args),
  }
})

vi.mock('../lib/firebase', () => ({
  db: {},
}))

vi.mock('../hooks/usePageMeta', () => ({
  usePageMeta: vi.fn(),
}))

describe('PaperDetail page', () => {
  it('renders paper details when the document exists', async () => {
    getDocMock.mockResolvedValue({
      exists: () => true,
      id: 'paper-1',
      data: () => buildPaper({
        title: 'Study detail',
        summary: 'Summary: Key result.',
        abstract: 'Body',
      }),
    })

    render(
      <MemoryRouter initialEntries={['/research/paper-1']}>
        <Routes>
          <Route path="/research/:paperId" element={<PaperDetail />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Study detail')).toBeInTheDocument()
    expect(screen.getByText('Key result.')).toBeInTheDocument()
    expect(screen.getByText('Body')).toBeInTheDocument()
  })

  it('renders not-found state', async () => {
    getDocMock.mockResolvedValue({
      exists: () => false,
      id: 'paper-1',
      data: () => ({}),
    })

    render(
      <MemoryRouter initialEntries={['/research/paper-1']}>
        <Routes>
          <Route path="/research/:paperId" element={<PaperDetail />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Studie nicht gefunden.')).toBeInTheDocument()
  })
})
