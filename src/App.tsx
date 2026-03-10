import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { HomePage } from '@/pages/home/HomePage'
import { AuthPage } from '@/pages/auth/AuthPage'
import { NewRoundPage } from '@/pages/round/NewRoundPage'
import { DemoRoundPage } from '@/pages/round/DemoRoundPage'
import { useAuth } from '@/stores/auth'

function App() {
  const { initialize } = useAuth()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/crews" element={<Placeholder title="Crews" />} />
          <Route path="/history" element={<Placeholder title="History" />} />
          <Route path="/profile" element={<Placeholder title="Profile" />} />
          <Route path="/settle" element={<Placeholder title="Settle Up" />} />
        </Route>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/round/new" element={<NewRoundPage />} />
        <Route path="/round/demo" element={<DemoRoundPage />} />
        <Route path="/round/join" element={<Placeholder title="Join Round" />} />
      </Routes>
    </BrowserRouter>
  )
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="px-4 pt-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="text-gray-500 mt-2">Coming soon</p>
    </div>
  )
}

export default App
