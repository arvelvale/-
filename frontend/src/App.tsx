import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import MainLayout from './layouts/MainLayout'
import DiaryPage from './pages/DiaryPage'
import InsightsPage from './pages/InsightsPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/diary" replace />} />
        <Route path="diary" element={<DiaryPage />} />
        <Route path="insights" element={<InsightsPage />} />
      </Route>
    </Routes>
  )
}

export default App
