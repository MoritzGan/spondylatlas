import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'

// ── Lazy-loaded pages ────────────────────────────────────────────────────────
const Forum = lazy(() => import('./pages/Forum'))
const ForumCategory = lazy(() => import('./pages/ForumCategory'))
const ForumThread = lazy(() => import('./pages/ForumThread'))
const NewPost = lazy(() => import('./pages/NewPost'))
const Research = lazy(() => import('./pages/Research'))
const PaperDetail = lazy(() => import('./pages/PaperDetail'))
const Login = lazy(() => import('./pages/Login'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const Register = lazy(() => import('./pages/Register'))
const Profile = lazy(() => import('./pages/Profile'))
const Hypotheses = lazy(() => import('./pages/Hypotheses'))
const HypothesisDetail = lazy(() => import('./pages/HypothesisDetail'))
const Trials = lazy(() => import('./pages/Trials'))
const TrialDetail = lazy(() => import('./pages/TrialDetail'))
const AgentArena = lazy(() => import('./pages/AgentArena'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Imprint = lazy(() => import('./pages/Imprint'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const TermsOfUse = lazy(() => import('./pages/TermsOfUse'))
const CommunityRules = lazy(() => import('./pages/CommunityRules'))
const StorageNotice = lazy(() => import('./pages/StorageNotice'))
const ReportContent = lazy(() => import('./pages/ReportContent'))
const PrivacyContact = lazy(() => import('./pages/PrivacyContact'))

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Landing />} />
            <Route
              path="*"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route
                      path="forum"
                      element={
                        <ProtectedRoute requireVerifiedEmail requireHealthConsent>
                          <Forum />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="forum/:category"
                      element={
                        <ProtectedRoute requireVerifiedEmail requireHealthConsent>
                          <ForumCategory />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="forum/:category/new"
                      element={
                        <ProtectedRoute requireVerifiedEmail requireHealthConsent>
                          <NewPost />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="forum/:category/:postId"
                      element={
                        <ProtectedRoute requireVerifiedEmail requireHealthConsent>
                          <ForumThread />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="research" element={<Research />} />
                    <Route path="research/:paperId" element={<PaperDetail />} />
                    <Route path="login" element={<Login />} />
                    <Route path="passwort-vergessen" element={<ForgotPassword />} />
                    <Route path="register" element={<Register />} />
                    <Route path="impressum" element={<Imprint />} />
                    <Route path="datenschutz" element={<PrivacyPolicy />} />
                    <Route path="nutzungsbedingungen" element={<TermsOfUse />} />
                    <Route path="community-regeln" element={<CommunityRules />} />
                    <Route path="cookies-und-speicherungen" element={<StorageNotice />} />
                    <Route path="meldung" element={<ReportContent />} />
                    <Route path="kontakt-datenschutz" element={<PrivacyContact />} />
                    <Route
                      path="profile"
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="trials" element={<Trials />} />
                    <Route path="trials/:nctId" element={<TrialDetail />} />
                    <Route path="hypotheses" element={<Hypotheses />} />
                    <Route path="hypotheses/:id" element={<HypothesisDetail />} />
                    <Route path="arena" element={<AgentArena />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
