import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  type User,
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import { createUserComplianceRecords } from '../lib/compliance'
import i18n from '../i18n'

type RegisterPayload = {
  email: string
  password: string
  displayName: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
  resendVerificationEmail: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function register({ email, password, displayName }: RegisterPayload) {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(result.user, { displayName })
    await sendEmailVerification(result.user)
    await createUserComplianceRecords(
      result.user,
      displayName,
      i18n.language.startsWith('de') ? 'de' : 'en',
    )
  }

  async function logout() {
    await signOut(auth)
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email)
  }

  async function resendVerificationEmail() {
    if (!auth.currentUser) {
      throw new Error('No authenticated user available.')
    }

    await sendEmailVerification(auth.currentUser)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, resendVerificationEmail, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}
