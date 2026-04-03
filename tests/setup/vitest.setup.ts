import '@testing-library/jest-dom/vitest'
import i18n from '../../src/i18n'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock)

beforeEach(async () => {
  await i18n.changeLanguage('de')
  document.head.innerHTML = ''
  document.body.innerHTML = ''
})

// Mock Firebase to avoid auth/invalid-api-key errors in unit tests
vi.mock('../../src/lib/firebase', () => ({
  app: {},
  auth: { currentUser: null, onAuthStateChanged: vi.fn() },
  db: {
    collection: vi.fn(),
    doc: vi.fn(),
  },
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null })),
  onAuthStateChanged: vi.fn((_auth: unknown, cb: (user: null) => void) => { cb(null); return () => {}; }),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false })),
  addDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(() => () => {}),
  serverTimestamp: vi.fn(() => new Date()),
  Timestamp: { 
    now: vi.fn(() => ({ toDate: () => new Date(), seconds: 0, nanoseconds: 0 })), 
    fromDate: vi.fn((d: Date) => ({ toDate: () => d, seconds: Math.floor(d.getTime()/1000), nanoseconds: 0 })),
    fromMillis: vi.fn((ms: number) => ({ toDate: () => new Date(ms), seconds: Math.floor(ms/1000), nanoseconds: 0 })),
  },
}))
