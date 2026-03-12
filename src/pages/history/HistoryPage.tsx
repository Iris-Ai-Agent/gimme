import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { db as supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/stores/auth'
import { FORMAT_LABELS, type RoundWithGames } from '@/types/database'

type FilterTab = 'all' | 'active' | 'complete'

export function HistoryPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [rounds, setRounds] = useState<RoundWithGames[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterTab>('all')

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
          .select('id, status, created_at, courses(name, holes), round_players!inner(profile_id), games(format)')
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

  const activeCount = useMemo(() => rounds.filter((r) => r.status === 'active').length, [rounds])
  const completeCount = useMemo(() => rounds.filter((r) => r.status === 'complete').length, [rounds])

  const filteredRounds = useMemo(() =>
    filter === 'all' ? rounds : rounds.filter((r) => r.status === filter),
  [rounds, filter])

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

      {/* Stats bar */}
      {rounds.length > 0 && (
        <div className="flex gap-4 px-4 py-3 justify-center" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E8E3DA' }}>
          <div className="text-center">
            <p className="text-xl font-bold" style={{ color: '#2D4A3E' }}>{rounds.length}</p>
            <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: '#8a8578' }}>Rounds</p>
          </div>
          <div className="w-px" style={{ backgroundColor: '#E8E3DA' }} />
          <div className="text-center">
            <p className="text-xl font-bold" style={{ color: '#C4A962' }}>{activeCount}</p>
            <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: '#8a8578' }}>Live</p>
          </div>
          <div className="w-px" style={{ backgroundColor: '#E8E3DA' }} />
          <div className="text-center">
            <p className="text-xl font-bold" style={{ color: '#2D4A3E' }}>{completeCount}</p>
            <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: '#8a8578' }}>Complete</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      {rounds.length > 0 && (
        <div className="flex px-4 pt-3 gap-2">
          {(['all', 'active', 'complete'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className="px-3 py-1.5 rounded-full text-xs font-medium tap-target transition-all"
              style={{
                backgroundColor: filter === tab ? '#2D4A3E' : '#2D4A3E10',
                color: filter === tab ? '#F5F0E8' : '#2D4A3E',
              }}
            >
              {tab === 'all' ? `All (${rounds.length})` : tab === 'active' ? `Live (${activeCount})` : `Complete (${completeCount})`}
            </button>
          ))}
        </div>
      )}

      <div className="px-4 pt-3 pb-4 max-w-lg mx-auto w-full space-y-3">
        {rounds.length === 0 ? (
          <EmptyState
            icon="⛳"
            title="No rounds yet"
            description="Start a round and your history will show up here."
            actionLabel="Start a Round"
            onAction={() => navigate('/round/new')}
          />
        ) : filteredRounds.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: '#8a8578' }}>No {filter} rounds</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRounds.map((round) => (
              <button
                key={round.id}
                className="w-full bg-white rounded-xl px-3 py-3 text-left
                  transition-all active:scale-[0.98]
                  focus-visible:ring-2 focus-visible:ring-[#2D4A3E]"
                style={{ border: `1px solid ${round.status === 'active' ? '#C4A96240' : '#e8e3da'}` }}
                onClick={() => navigate(`/round/${round.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: round.status === 'active' ? '#C4A962' : '#2D4A3E' }}
                  >
                    <span className="text-lg leading-none">{round.status === 'active' ? '🔴' : '⛳'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate" style={{ color: '#2D4A3E' }}>
                      {round.courses?.name || 'Unknown Course'}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: '#8a8578' }}>
                      {round.games && round.games.length > 0
                        ? round.games.map((g) => FORMAT_LABELS[g.format] || g.format).join(', ')
                        : 'No games'}
                      {' · '}{round.courses?.holes || '?'} holes
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {round.status === 'active' ? (
                      <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: '#C4A96220', color: '#C4A962' }}>
                        Live
                      </span>
                    ) : (
                      <span className="text-xs font-medium" style={{ color: '#8a8578' }}>
                        {new Date(round.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
