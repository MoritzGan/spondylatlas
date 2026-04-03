import { useEffect } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

const onAuthStateChangedMock = vi.fn()
const signInWithEmailAndPasswordMock = vi.fn()
const createUserWithEmailAndPasswordMock = vi.fn()
const signOutMock = vi.fn()
const sendEmailVerificationMock = vi.fn()
const sendPasswordResetEmailMock = vi.fn()
const updateProfileMock = vi.fn()
const createUserComplianceRecordsMock = vi.fn()

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args: unknown[]) => onAuthStateChangedMock(...args),
  signInWithEmailAndPassword: (...args: unknown[]) => signInWithEmailAndPasswordMock(...args),
  createUserWithEmailAndPassword: (...args: unknown[]) => createUserWithEmailAndPasswordMock(...args),
  signOut: (...args: unknown[]) => signOutMock(...args),
  sendEmailVerification: (...args: unknown[]) => sendEmailVerificationMock(...args),
  sendPasswordResetEmail: (...args: unknown[]) => sendPasswordResetEmailMock(...args),
  updateProfile: (...args: unknown[]) => updateProfileMock(...args),
}))

vi.mock('../lib/firebase', () => ({
  auth: { currentUser: { uid: 'current-user' } },
}))

vi.mock('../lib/compliance', () => ({
  createUserComplianceRecords: (...args: unknown[]) => createUserComplianceRecordsMock(...args),
}))

function Consumer() {
  const auth = useAuth()

  useEffect(() => {
    void auth.login('mail@example.com', 'secret')
    void auth.register({
      email: 'new@example.com',
      password: 'long-password',
      displayName: 'New User',
    })
    void auth.resetPassword('mail@example.com')
    void auth.logout()
    void auth.resendVerificationEmail()
  }, [auth])

  return <div>{auth.loading ? 'loading' : auth.user?.uid ?? 'anonymous'}</div>
}

describe('AuthContext', () => {
  beforeEach(() => {
    onAuthStateChangedMock.mockImplementation((_auth, callback) => {
      callback({ uid: 'auth-user' })
      return vi.fn()
    })
    signInWithEmailAndPasswordMock.mockResolvedValue(undefined)
    createUserWithEmailAndPasswordMock.mockResolvedValue({
      user: { uid: 'new-user', email: 'new@example.com' },
    })
    signOutMock.mockResolvedValue(undefined)
    sendEmailVerificationMock.mockResolvedValue(undefined)
    sendPasswordResetEmailMock.mockResolvedValue(undefined)
    updateProfileMock.mockResolvedValue(undefined)
    createUserComplianceRecordsMock.mockResolvedValue(undefined)
  })

  it('wires login/register/logout/reset and compliance creation', async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    )

    expect(await screen.findByText('auth-user')).toBeInTheDocument()

    await waitFor(() => {
      expect(signInWithEmailAndPasswordMock).toHaveBeenCalled()
      expect(createUserWithEmailAndPasswordMock).toHaveBeenCalled()
      expect(updateProfileMock).toHaveBeenCalledWith(
        { uid: 'new-user', email: 'new@example.com' },
        { displayName: 'New User' },
      )
      expect(sendEmailVerificationMock).toHaveBeenCalled()
      expect(createUserComplianceRecordsMock).toHaveBeenCalledWith(
        { uid: 'new-user', email: 'new@example.com' },
        'New User',
        'de',
      )
      expect(sendPasswordResetEmailMock).toHaveBeenCalled()
      expect(signOutMock).toHaveBeenCalled()
    })
  })
})
