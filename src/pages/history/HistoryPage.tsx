import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db as supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
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
          .eq('round_players.profile_id', user!.id)
          .in('status', ['active', 'complete'])
          .order('created_at', { ascending: false })
          .limit(50)

        if (fetchError) {
          console.warn('Supabase fetch error:', fetchError.message)
          throw fetchError
        }
        setRounds(data || [])
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        setError(`Failed to load round history: ${msg}`)
      } finally {
        setLoading(false)
      }
    }
    fetchRounds()
  }, [user])

  if (loading) return <PageSkeleton />

  if (error) {
    return (
      <div className="min-h-dvh flex flex-col" style={{ backgroundColor: '#F5F0E8' }}>
        <div className="w-full px-4 py-4 flex items-center justify-between" style={{ backgroundColor: '#2D4A3E' }}>
          <h1 className="text-lg font-bold text-[#F5F0E8]">History</h1>
        </div>
        <div className="px-4 pt-6 max-w-lg mx-auto text-center space-y-4 py-8">
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
      <div className="min-h-dvh flex flex-col" style={{ backgroundColor: '#F5F0E8' }}>
        <div className="w-full px-4 py-4" style={{ backgroundColor: '#2D4A3E' }}>
          <h1 className="text-lg font-bold text-[#F5F0E8]">History</h1>
        </div>
        <div className="px-4 pt-6 max-w-lg mx-auto">
          <EmptyState
            icon="📊"
            title="Sign in to see history"
            description="Your past rounds and stats will appear here."
            actionLabel="Sign In"
            onAction={() => navigate('/auth')}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col animate-fade-in" style={{ backgroundColor: '#F5F0E8' }}>
      {/* Green header */}
      <div className="w-full px-4 py-4 flex items-center justify-between" style={{ backgroundColor: '#2D4A3E' }}>
        <h1 className="text-lg font-bold text-[#F5F0E8]">History</h1>
        <button
          onClick={() => navigate('/round/new')}
          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg tap-target"
          style={{ backgroundColor: '#C4A962', color: '#2D4A3E' }}
        >
          +
        </button>
      </div>

      <div className="px-4 pt-3 pb-4 max-w-lg mx-auto w-full space-y-3">
        {rounds.length === 0 ? (
          <EmptyState
            icon="⛳"
            title="No rounds yet"
            description="Start a round and your history will show up here."
            actionLabel="Start a Round"
            onAction={() => navigate('/round/new')}
          />
        ) : (
          <div className="space-y-2">
            {rounds.map((round) => (
              <button
                key={round.id}
                className="w-full bg-white rounded-xl px-3 py-3 text-left
                  transition-all active:scale-[0.98]
                  focus-visible:ring-2 focus-visible:ring-[#2D4A3E]"
                style={{ border: '1px solid #e8e3da' }}
                onClick={() => navigate(`/round/${round.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#2D4A3E' }}
                  >
                    <span className="text-lg leading-none">⛳</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate" style={{ color: '#2D4A3E' }}>
                      {round.courses?.name || 'Unknown Course'}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: '#8a8578' }}>
                      {round.status === 'active' ? 'In Progress' : 'Complete'} · Skins
                    </p>
                  </div>
                  <span className="text-sm font-bold flex-shrink-0" style={{ color: round.status === 'active' ? '#C4A962' : '#2D4A3E' }}>
                    {round.status === 'active' ? 'Live' : '+$0'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
