import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import LandingPage from './pages/LandingPage'
import ChallengesPage from './pages/ChallengesPage'
import ChallengePage from './pages/ChallengePage'
import ClubsPage from './pages/ClubsPage'
import CommunityPage from './pages/CommunityPage'
import SubmitScorePage from './pages/SubmitScorePage'
import AdminDashboard from './pages/AdminDashboard'
import CreateChallengePage from './pages/CreateChallengePage'
import ArchivePage from './pages/ArchivePage'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/challenges" element={<ChallengesPage />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/c/:slug" element={<ChallengePage />} />
        <Route path="/clubs" element={<ClubsPage />} />
        <Route path="/club/:slug" element={<CommunityPage />} />
        <Route path="/submit" element={<SubmitScorePage />} />
        <Route path="/submit/:slug" element={<SubmitScorePage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/create" element={<CreateChallengePage />} />
        <Route path="/create/:slug" element={<CreateChallengePage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
