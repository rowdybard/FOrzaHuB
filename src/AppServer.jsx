// SSR-only App with eager imports — no lazy loading or Suspense.
// This ensures renderToReadableStream outputs the full page content
// (H1, text, data) in the initial HTML, not a "Loading…" fallback.
// The client-side App.jsx keeps lazy imports for code splitting.

import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import LandingPage from './pages/LandingPage'
import BetaSeriesPage from './pages/BetaSeriesPage'
import ChallengesPage from './pages/ChallengesPage'
import ChallengePage from './pages/ChallengePage'
import ClubsPage from './pages/ClubsPage'
import CommunityPage from './pages/CommunityPage'
import SubmitScorePage from './pages/SubmitScorePage'
import AdminDashboard from './pages/AdminDashboard'
import CreateChallengePage from './pages/CreateChallengePage'
import CreateClubPage from './pages/CreateClubPage'
import ArchivePage from './pages/ArchivePage'
import OfficialRulesPage from './pages/OfficialRulesPage'
import ProfilePage from './pages/ProfilePage'
import NotFound from './pages/NotFound'

export default function AppServer() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/beta-series" element={<BetaSeriesPage />} />
        <Route path="/challenges" element={<ChallengesPage />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/c/:slug" element={<ChallengePage />} />
        <Route path="/clubs" element={<ClubsPage />} />
        <Route path="/clubs/new" element={<CreateClubPage />} />
        <Route path="/club/:slug" element={<CommunityPage />} />
        <Route path="/submit" element={<SubmitScorePage />} />
        <Route path="/submit/:slug" element={<SubmitScorePage />} />
        <Route path="/me" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/create" element={<CreateChallengePage />} />
        <Route path="/create/:slug" element={<CreateChallengePage />} />
        <Route path="/official-rules" element={<OfficialRulesPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
