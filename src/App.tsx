import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { HomePage } from '@/pages/home/HomePage'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { ToastContainer } from '@/components/ui/Toast'
import { useAuth } from '@/stores/auth'
import { useRound } from '@/stores/round'

const AuthPage = lazy(() => import('@/pages/auth/AuthPage').then(m => ({ default: m.AuthPage })))
const NewRoundPage = lazy(() => import('@/pages/round/NewRoundPage').then(m => ({ default: m.NewRoundPage })))
const DemoRoundPage = lazy(() => import('@/pages/round/DemoRoundPage').then(m => ({ default: m.DemoRoundPage })))
const RoundPage = lazy(() => import('@/pages/round/RoundPage').then(m => ({ default: m.RoundPage })))
const JoinRoundPage = lazy(() => import('@/pages/round/JoinRoundPage').then(m => ({ default: m.JoinRoundPage })))
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage').then(m => ({ default: m.ProfilePage })))
const HistoryPage = lazy(() => import('@/pages/history/HistoryPage').then(m => ({ default: m.HistoryPage })))
const CrewsPage = lazy(() => import('@/pages/crews/CrewsPage').then(m => ({ default: m.CrewsPage })))
const SettlePage = lazy(() => import('@/pages/settle/SettlePage').then(m => ({ default: m.SettlePage })))

function App() {
  const { initialize } = useAuth()
  const { syncPendingScores } = useRound()

  useEffect(() => {
    initialize()
  }, [initialize])

  // Sync offline scores on startup and when connectivity is restored
  useEffect(() => {
    syncPendingScores()
    const handleOnline = () => { syncPendingScores() }
    window.addEventListener('online', handleOnline)
    return () => { window.removeEventListener('online', handleOnline) }
  }, [syncPendingScores])

  return (
    <BrowserRouter>
      <ToastContainer />
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/crews" element={<CrewsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settle" element={<SettlePage />} />
          </Route>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/round/new" element={<NewRoundPage />} />
          <Route path="/round/demo" element={<DemoRoundPage />} />
          <Route path="/round/join" element={<JoinRoundPage />} />
          <Route path="/round/:roundId" element={<RoundPage />} />
          <Route path="*" element={
            <div className="min-h-dvh flex items-center justify-center p-6" style={{ backgroundColor: '#F5F0E8' }}>
              <div className="text-center">
                <p className="text-6xl mb-4">⛳</p>
                <h1 className="text-2xl font-bold mb-2" style={{ color: '#2D4A3E' }}>Lost in the Rough</h1>
                <p className="mb-6" style={{ color: '#2D4A3E', opacity: 0.5 }}>This hole doesn't exist.</p>
                <a href="/" className="font-medium" style={{ color: '#C4A962' }}>Back to the Clubhouse</a>
              </div>
            </div>
          } />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
