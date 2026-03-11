import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { toast } from '@/components/ui/Toast'
import { useAuth } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import type { RoundWithCourse } from '@/types/database'

export function HomePage() {
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()
  const [activeRounds, setActiveRounds] = useState<RoundWithCourse[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchRounds = useCallback(() => {
    if (!user) return
    let cancelled = false
    setError(null)
    supabase
      .from('rounds')
      .select('id, status, created_at, courses(name, holes), round_players!inner(profile_id)')
      .eq('round_players.profile_id', user.id)
      .in('status', ['setup', 'active'])
      .order('created_at', { ascending: false })
      .limit(5)
      .returns<RoundWithCourse[]>()
      .then(({ data }) => {
        if (!cancelled) setActiveRounds(data || [])
      })
      .catch((err) => {
        console.error('Failed to fetch active rounds:', err)
        if (!cancelled) {
          setError('Failed to load rounds')
          toast('error', 'Failed to load rounds')
        }
      })
    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    return fetchRounds()
  }, [fetchRounds])

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-masters-green dark:text-gold">Gimme</h1>
          {profile ? (
            <p className="text-sm text-gray-500 mt-0.5">Hey {profile.display_name} 👋</p>
          ) : authLoading ? (
            <div className="h-4 w-24 mt-1 bg-rough dark:bg-night-border rounded animate-pulse" />
          ) : null}
        </div>
        <div className="w-10 h-10 rounded-full bg-masters-green/10 flex items-center justify-center text-lg">
          ⛳
        </div>
      </div>

      {/* Main CTA */}
      <Button
        size="lg"
        fullWidth
        onClick={() => navigate('/round/new')}
        className="shadow-lg shadow-masters-green/20"
      >
        Start a Round
      </Button>

      {/* Active rounds */}
      {activeRounds.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Active Rounds</h2>
          {activeRounds.map((round) => (
            <Card
              key={round.id}
              interactive
              className="cursor-pointer hover:border-masters-green/30 transition-all active:scale-[0.98]"
              onClick={() => navigate(`/round/${round.id}`)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{round.courses?.name || 'Unknown Course'}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {round.courses?.holes || 18} holes · {round.status === 'active' ? 'In progress' : 'Setting up'}
                  </p>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full ${
                  round.status === 'active' ? 'bg-masters-green animate-pulse' : 'bg-gold'
                }`} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && activeRounds.length === 0 && (
        <Card variant="elevated" className="text-center space-y-3">
          <p className="text-birdie-red">{error}</p>
          <Button variant="ghost" onClick={() => fetchRounds()}>
            Retry
          </Button>
        </Card>
      )}

      {/* Sign in prompt */}
      {!user && !authLoading && (
        <Card variant="elevated" className="text-center space-y-3">
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to track your rounds, stats, and settle up with your crew.
          </p>
          <Button variant="secondary" onClick={() => navigate('/auth')}>
            Sign In
          </Button>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Card
            interactive
            className="cursor-pointer hover:border-masters-green/30 transition-all active:scale-[0.98]"
            onClick={() => navigate('/round/join')}
          >
            <div className="text-2xl mb-1">🔗</div>
            <div className="font-medium text-sm">Join Round</div>
            <div className="text-xs text-gray-500 mt-0.5">Enter invite code</div>
          </Card>
          <Card
            interactive
            className="cursor-pointer hover:border-masters-green/30 transition-all active:scale-[0.98]"
            onClick={() => navigate('/crews')}
          >
            <div className="text-2xl mb-1">👥</div>
            <div className="font-medium text-sm">My Crews</div>
            <div className="text-xs text-gray-500 mt-0.5">Manage your groups</div>
          </Card>
          <Card
            interactive
            className="cursor-pointer hover:border-masters-green/30 transition-all active:scale-[0.98]"
            onClick={() => navigate('/history')}
          >
            <div className="text-2xl mb-1">📊</div>
            <div className="font-medium text-sm">Stats</div>
            <div className="text-xs text-gray-500 mt-0.5">Round history</div>
          </Card>
          <Card
            interactive
            className="cursor-pointer hover:border-masters-green/30 transition-all active:scale-[0.98]"
            onClick={() => navigate('/settle')}
          >
            <div className="text-2xl mb-1">💰</div>
            <div className="font-medium text-sm">Settle Up</div>
            <div className="text-xs text-gray-500 mt-0.5">Who owes who</div>
          </Card>
        </div>
      </div>

      {/* Demo link */}
      <button
        onClick={() => navigate('/round/demo')}
        className="block mx-auto py-3 px-4 tap-target text-sm text-gray-500 hover:text-gray-600 transition-colors"
      >
        Try the demo round (no sign in required)
      </button>
    </div>
  )
}
