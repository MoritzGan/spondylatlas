import { Routes, Route } from 'react-router-dom'
import { renderWithRouter } from '../../tests/helpers/render'
import ProtectedRoute from './ProtectedRoute'

const useAuthMock = vi.fn()
const hasActiveCommunityAccessMock = vi.fn()

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../lib/communityAccess', () => ({
  hasActiveCommunityAccess: (...args: unknown[]) => hasActiveCommunityAccessMock(...args),
}))

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    hasActiveCommunityAccessMock.mockReset()
  })

  it('redirects anonymous users to login', () => {
    useAuthMock.mockReturnValue({
      user: null,
      loading: false,
      resendVerificationEmail: vi.fn(),
    })

    const { getByText } = renderWithRouter(
      <Routes>
        <Route
          path="/forum"
          element={
            <ProtectedRoute>
              <div>secret</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>login page</div>} />
      </Routes>,
      { route: '/forum' },
    )

    expect(getByText('login page')).toBeInTheDocument()
  })

  it('shows verification message when email is unverified', () => {
    const resendVerificationEmail = vi.fn()
    useAuthMock.mockReturnValue({
      user: { emailVerified: false },
      loading: false,
      resendVerificationEmail,
    })

    const { getByText } = renderWithRouter(
      <ProtectedRoute requireVerifiedEmail>
        <div>secret</div>
      </ProtectedRoute>,
    )

    expect(getByText('E-Mail-Bestaetigung erforderlich')).toBeInTheDocument()
  })

  it('blocks community access without health consent', async () => {
    useAuthMock.mockReturnValue({
      user: { uid: 'user-1', emailVerified: true },
      loading: false,
      resendVerificationEmail: vi.fn(),
    })
    hasActiveCommunityAccessMock.mockResolvedValue(false)

    const { findByText } = renderWithRouter(
      <ProtectedRoute requireVerifiedEmail requireHealthConsent>
        <div>secret</div>
      </ProtectedRoute>,
    )

    expect(await findByText('Community-Zugang gesperrt')).toBeInTheDocument()
  })
})
