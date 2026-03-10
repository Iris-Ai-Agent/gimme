import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/stores/auth'

export function HomePage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-masters-green dark:text-gold">Gimme</h1>
          {profile && (
            <p className="text-sm text-gray-500 mt-0.5">Hey {profile.display_name} 👋</p>
          )}
        </div>
        <div className="w-10 h-10 rounded-full bg-masters-green/10 flex items-center justify-center text-lg">
          ⛳
        </div>
      </div>

      <Button
        size="lg"
        fullWidth
        onClick={() => navigate('/round/new')}
        className="shadow-lg shadow-masters-green/20"
      >
        Start a Round
      </Button>

      {!user && (
        <Card variant="elevated" className="text-center space-y-3">
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to track your rounds, stats, and settle up with your crew.
          </p>
          <Button variant="secondary" onClick={() => navigate('/auth')}>
            Sign In
          </Button>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Card className="cursor-pointer hover:border-masters-green/30 transition-colors" onClick={() => navigate('/round/join')}>
            <div className="text-2xl mb-1">🔗</div>
            <div className="font-medium text-sm">Join Round</div>
            <div className="text-xs text-gray-500 mt-0.5">Enter invite code</div>
          </Card>
          <Card className="cursor-pointer hover:border-masters-green/30 transition-colors" onClick={() => navigate('/crews')}>
            <div className="text-2xl mb-1">👥</div>
            <div className="font-medium text-sm">My Crews</div>
            <div className="text-xs text-gray-500 mt-0.5">Manage your groups</div>
          </Card>
          <Card className="cursor-pointer hover:border-masters-green/30 transition-colors" onClick={() => navigate('/history')}>
            <div className="text-2xl mb-1">📊</div>
            <div className="font-medium text-sm">Stats</div>
            <div className="text-xs text-gray-500 mt-0.5">Round history</div>
          </Card>
          <Card className="cursor-pointer hover:border-masters-green/30 transition-colors" onClick={() => navigate('/settle')}>
            <div className="text-2xl mb-1">💰</div>
            <div className="font-medium text-sm">Settle Up</div>
            <div className="text-xs text-gray-500 mt-0.5">Who owes who</div>
          </Card>
        </div>
      </div>
    </div>
  )
}
