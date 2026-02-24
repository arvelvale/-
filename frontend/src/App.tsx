import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import MainLayout from './layouts/MainLayout'
import DiaryPage from './pages/DiaryPage'
import InsightsPage from './pages/InsightsPage'
import AIAnalysisPage from './pages/AIAnalysisPage'
import SocialPostPage from './pages/SocialPostPage'
import ProfilePage from './pages/ProfilePage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {/* All routes below require login */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/diary" replace />} />
          <Route path="diary" element={<DiaryPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="ai" element={<AIAnalysisPage />} />
          <Route path="social" element={<SocialPostPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
