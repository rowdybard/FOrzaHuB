import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Layout from './components/layout/Layout'
import LandingPage from './pages/LandingPage'
import Loading from './components/common/Loading'

const BetaSeriesPage = lazy(() => import('./pages/BetaSeriesPage'))
const ChallengesPage = lazy(() => import('./pages/ChallengesPage'))
const ChallengePage = lazy(() => import('./pages/ChallengePage'))
const ClubsPage = lazy(() => import('./pages/ClubsPage'))
const CommunityPage = lazy(() => import('./pages/CommunityPage'))
const SubmitScorePage = lazy(() => import('./pages/SubmitScorePage'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const CreateChallengePage = lazy(() => import('./pages/CreateChallengePage'))
const CreateClubPage = lazy(() => import('./pages/CreateClubPage'))
const ArchivePage = lazy(() => import('./pages/ArchivePage'))
const OfficialRulesPage = lazy(() => import('./pages/OfficialRulesPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const NotFound = lazy(() => import('./pages/NotFound'))

const fallback = <Loading label="Loading…" className="min-h-[60vh]" />

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/beta-series" element={<Suspense fallback={fallback}><BetaSeriesPage /></Suspense>} />
        <Route path="/challenges" element={<Suspense fallback={fallback}><ChallengesPage /></Suspense>} />
        <Route path="/archive" element={<Suspense fallback={fallback}><ArchivePage /></Suspense>} />
        <Route path="/c/:slug" element={<Suspense fallback={fallback}><ChallengePage /></Suspense>} />
        <Route path="/clubs" element={<Suspense fallback={fallback}><ClubsPage /></Suspense>} />
        <Route path="/clubs/new" element={<Suspense fallback={fallback}><CreateClubPage /></Suspense>} />
        <Route path="/club/:slug" element={<Suspense fallback={fallback}><CommunityPage /></Suspense>} />
        <Route path="/submit" element={<Suspense fallback={fallback}><SubmitScorePage /></Suspense>} />
        <Route path="/submit/:slug" element={<Suspense fallback={fallback}><SubmitScorePage /></Suspense>} />
        <Route path="/me" element={<Suspense fallback={fallback}><ProfilePage /></Suspense>} />
        <Route path="/admin" element={<Suspense fallback={fallback}><AdminDashboard /></Suspense>} />
        <Route path="/create" element={<Suspense fallback={fallback}><CreateChallengePage /></Suspense>} />
        <Route path="/create/:slug" element={<Suspense fallback={fallback}><CreateChallengePage /></Suspense>} />
        <Route path="/official-rules" element={<Suspense fallback={fallback}><OfficialRulesPage /></Suspense>} />
        <Route path="*" element={<Suspense fallback={fallback}><NotFound /></Suspense>} />
      </Route>
    </Routes>
  )
}
