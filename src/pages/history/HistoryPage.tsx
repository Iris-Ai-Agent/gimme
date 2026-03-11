import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/stores/auth'
import type { RoundWithCourse } from '@/types/database'

export function HistoryPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [rounds, setRounds] = useState<RoundWithCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    async function fetchRounds() {
      try {
        setError(null)
        const { data, error: fetchError } = await supabase
          .from('rounds')
          .select('id, status, created_at, courses(name, holes), round_players!inner(profile_id)')
          .eq('round_players.profile_id', user.id)
          .eq('status', 'complete')
          .order('created_at', { ascending: false })
          .limit(50)
          .returns<RoundWithCourse[]>()

        if (fetchError) throw fetchError
        setRounds(data || [])
      } catch {
        setError('Failed to load round history. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchRounds()
  }, [user])

  if (loading) return <PageSkeleton />

  if (error) {
    return (
      <div className="px-4 pt-6 max-w-lg mx-auto space-y-4">
        <h1 className="text-xl font-bold">Round History</h1>
        <div className="text-center space-y-4 py-8">
          <p className="text-birdie-red">{error}</p>
          <Button variant="secondary" onClick={() => { setLoading(true); setError(null); window.location.reload() }}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="px-4 pt-6 max-w-lg mx-auto">
        <h1 className="text-xl font-bold mb-6">Round History</h1>
        <EmptyState
          icon="📊"
          title="Sign in to see history"
          description="Your past rounds and stats will appear here."
          actionLabel="Sign In"
          onAction={() => navigate('/auth')}
        />
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-4 animate-fade-in">
      <h1 className="text-xl font-bold">Round History</h1>

      {rounds.length === 0 ? (
        <EmptyState
          icon="⛳"
          title="No rounds yet"
          description="Start a round and your history will show up here."
          actionLabel="Start a Round"
          onAction={() => navigate('/round/new')}
        />
      ) : (
        <div className="space-y-3">
          {rounds.map((round) => (
            <Card
              key={round.id}
              className="cursor-pointer hover:border-masters-green/30 transition-colors"
              onClick={() => navigate(`/round/${round.id}`)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{round.courses?.name || 'Unknown Course'}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(round.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    {' · '}
                    {round.courses?.holes || 18} holes
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  round.status === 'complete'
                    ? 'bg-masters-green/10 text-masters-green'
                    : round.status === 'active'
                      ? 'bg-gold/10 text-gold'
                      : 'bg-rough text-gray-500'
                }`}>
                  {round.status === 'complete' ? 'Complete' : round.status === 'active' ? 'In Progress' : 'Setup'}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
