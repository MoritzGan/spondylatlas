import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Profile from './Profile'

const useAuthMock = vi.fn()
const getHealthDataConsentMock = vi.fn()
const submitAccountRequestMock = vi.fn()
const withdrawHealthDataConsentMock = vi.fn()

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../lib/compliance', () => ({
  getHealthDataConsent: (...args: unknown[]) => getHealthDataConsentMock(...args),
  submitAccountRequest: (...args: unknown[]) => submitAccountRequestMock(...args),
  withdrawHealthDataConsent: (...args: unknown[]) => withdrawHealthDataConsentMock(...args),
}))

vi.mock('../hooks/usePageMeta', () => ({
  usePageMeta: vi.fn(),
}))

describe('Profile page', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({
      user: {
        uid: 'user-1',
        email: 'alex@example.com',
        emailVerified: false,
        displayName: 'Alex',
        metadata: { creationTime: '2026-04-01T10:00:00.000Z' },
      },
      resendVerificationEmail: vi.fn(),
    })
    getHealthDataConsentMock.mockResolvedValue({ granted: true })
    submitAccountRequestMock.mockResolvedValue(undefined)
    withdrawHealthDataConsentMock.mockResolvedValue(undefined)
  })

  it('loads consent state and triggers account requests and consent withdrawal', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Die dokumentierte Einwilligung für gesundheitsbezogene Community-Inhalte ist aktiv.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Gesundheitsdaten-Einwilligung widerrufen' }))
    expect(withdrawHealthDataConsentMock).toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Datenexport anfordern' }))
    await user.click(screen.getByRole('button', { name: 'Kontolöschung anfordern' }))

    await waitFor(() => {
      expect(submitAccountRequestMock).toHaveBeenNthCalledWith(1, expect.objectContaining({ uid: 'user-1' }), 'export')
      expect(submitAccountRequestMock).toHaveBeenNthCalledWith(2, expect.objectContaining({ uid: 'user-1' }), 'delete')
    })
  })
})
