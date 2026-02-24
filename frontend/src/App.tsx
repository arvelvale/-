import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import MainLayout from './layouts/MainLayout'
import DiaryPage from './pages/DiaryPage'
import InsightsPage from './pages/InsightsPage'
import AIAnalysisPage from './pages/AIAnalysisPage'
import SocialPostPage from './pages/SocialPostPage'
import ProfilePage from './pages/ProfilePage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/diary" replace />} />
        <Route path="diary" element={<DiaryPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="ai" element={<AIAnalysisPage />} />
        <Route path="social" element={<SocialPostPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  )
}

export default App
