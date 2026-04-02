import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Forum from './pages/Forum'
import ForumCategory from './pages/ForumCategory'
import ForumThread from './pages/ForumThread'
import NewPost from './pages/NewPost'
import Research from './pages/Research'
import PaperDetail from './pages/PaperDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Hypotheses from './pages/Hypotheses'
import HypothesisDetail from './pages/HypothesisDetail'
import AgentArena from './pages/AgentArena'
import NotFound from './pages/NotFound'
import Imprint from './pages/Imprint'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfUse from './pages/TermsOfUse'
import CommunityRules from './pages/CommunityRules'
import StorageNotice from './pages/StorageNotice'
import ReportContent from './pages/ReportContent'
import PrivacyContact from './pages/PrivacyContact'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="forum" element={<Forum />} />
            <Route path="forum/:category" element={<ForumCategory />} />
            <Route
              path="forum/:category/new"
              element={
                <ProtectedRoute>
                  <NewPost />
                </ProtectedRoute>
              }
            />
            <Route path="forum/:category/:postId" element={<ForumThread />} />
            <Route path="research" element={<Research />} />
            <Route path="research/:paperId" element={<PaperDetail />} />
            <Route path="login" element={<Login />} />
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
            <Route path="hypotheses" element={<Hypotheses />} />
            <Route path="hypotheses/:id" element={<HypothesisDetail />} />
            <Route path="arena" element={<AgentArena />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
