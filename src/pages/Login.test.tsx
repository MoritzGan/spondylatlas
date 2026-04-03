import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { FirebaseError } from 'firebase/app'
import Login from './Login'

const loginMock = vi.fn()
const navigateMock = vi.fn()

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: loginMock,
  }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('../hooks/usePageMeta', () => ({
  usePageMeta: vi.fn(),
}))

describe('Login page', () => {
  beforeEach(() => {
    loginMock.mockReset()
    navigateMock.mockReset()
  })

  it('submits credentials and navigates to profile', async () => {
    const user = userEvent.setup()
    loginMock.mockResolvedValue(undefined)

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('E-Mail'), 'alex@example.com')
    await user.type(screen.getByLabelText('Passwort'), '123')
    await user.click(screen.getByRole('button', { name: 'Anmelden' }))

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('alex@example.com', '123')
      expect(navigateMock).toHaveBeenCalledWith('/profile')
    })
  })

  it('maps invalid credentials to localized errors', async () => {
    const user = userEvent.setup()
    loginMock.mockRejectedValue(new FirebaseError('auth/invalid-credential', 'bad creds'))

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('E-Mail'), 'alex@example.com')
    await user.type(screen.getByLabelText('Passwort'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Anmelden' }))

    expect(await screen.findByText('E-Mail oder Passwort stimmt nicht.')).toBeInTheDocument()
  })
})
