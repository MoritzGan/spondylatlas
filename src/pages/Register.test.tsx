import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { FirebaseError } from 'firebase/app'
import Register from './Register'

const registerMock = vi.fn()
const navigateMock = vi.fn()

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    register: registerMock,
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

describe('Register page', () => {
  beforeEach(() => {
    registerMock.mockReset()
    navigateMock.mockReset()
  })

  it('keeps submit disabled until all legal confirmations are checked', async () => {
    const user = userEvent.setup()
    renderInRouter(<Register />)

    const submit = screen.getByRole('button', { name: 'Konto erstellen' })
    expect(submit).toBeDisabled()

    await user.type(screen.getByLabelText('Dein Name'), 'Alex')
    await user.type(screen.getByLabelText('E-Mail'), 'alex@example.com')
    await user.type(screen.getAllByLabelText('Passwort')[0], '123456789012')
    await user.type(screen.getByLabelText('Passwort wiederholen'), '123456789012')

    const checkboxes = screen.getAllByRole('checkbox')
    for (const checkbox of checkboxes) {
      await user.click(checkbox)
    }

    expect(submit).toBeEnabled()
  })

  it('shows mismatch error and maps firebase duplicate-email errors', async () => {
    const user = userEvent.setup()
    registerMock.mockRejectedValueOnce(
      new FirebaseError('auth/email-already-in-use', 'already used'),
    )

    renderInRouter(<Register />)

    await user.type(screen.getByLabelText('Dein Name'), 'Alex')
    await user.type(screen.getByLabelText('E-Mail'), 'alex@example.com')
    await user.type(screen.getAllByLabelText('Passwort')[0], '123456789012')
    await user.type(screen.getByLabelText('Passwort wiederholen'), 'different-password')
    await user.click(screen.getAllByRole('checkbox')[0])
    await user.click(screen.getAllByRole('checkbox')[1])
    await user.click(screen.getAllByRole('checkbox')[2])
    await user.click(screen.getAllByRole('checkbox')[3])
    await user.click(screen.getByRole('button', { name: 'Konto erstellen' }))

    expect(screen.getByText('Die Passwörter stimmen nicht überein.')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Passwort wiederholen'))
    await user.type(screen.getByLabelText('Passwort wiederholen'), '123456789012')
    await user.click(screen.getByRole('button', { name: 'Konto erstellen' }))

    await waitFor(() => {
      expect(screen.getByText('Diese E-Mail-Adresse ist bereits registriert.')).toBeInTheDocument()
    })
  })
})

function renderInRouter(ui: ReactNode) {
  return render(
    <MemoryRouter>
      {ui}
    </MemoryRouter>,
  )
}
