import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import NewPost from './NewPost'

const useAuthMock = vi.fn()
const createPostMock = vi.fn()
const navigateMock = vi.fn()

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../lib/forum', () => ({
  createPost: (...args: unknown[]) => createPostMock(...args),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

describe('NewPost page', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({
      user: {
        uid: 'user-1',
        displayName: 'Alex',
        email: 'alex@example.com',
      },
    })
    createPostMock.mockResolvedValue('post-1')
    navigateMock.mockReset()
  })

  it('creates a post and redirects back to the category with pending moderation state', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/forum/general/new']}>
        <Routes>
          <Route path="/forum/:category/new" element={<NewPost />} />
        </Routes>
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('Titel'), 'Thread title')
    await user.type(screen.getByLabelText('Inhalt'), 'Thread body')
    await user.click(screen.getByRole('button', { name: 'Veröffentlichen' }))

    await waitFor(() => {
      expect(createPostMock).toHaveBeenCalledWith(
        'Thread title',
        'Thread body',
        'general',
        'user-1',
        'Alex',
      )
      expect(navigateMock).toHaveBeenCalledWith('/forum/general', {
        state: { pendingModeration: true },
      })
    })
  })
})
