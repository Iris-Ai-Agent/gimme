import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { useAuth } from '@/stores/auth'
import { db as supabase } from '@/lib/supabase'
import type { RoundWithCourse } from '@/types/database'

function ChevronRightIcon({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const { user, profile, loading: authLoading, isDemo, signInAsDemo } = useAuth()
  const [activeRounds, setActiveRounds] = useState<RoundWithCourse[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchRounds = useCallback(() => {
    if (!user || isDemo) return
    let cancelled = false
    setError(null)
    supabase
      .from('rounds')
      .select('id, status, created_at, courses(name, holes), round_players!inner(profile_id)')
      .eq('round_players.profile_id', user.id)
      .in('status', ['setup', 'active'])
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }: any) => {
        if (!cancelled) setActiveRounds(data || [])
      })
      .catch((err: any) => {
        console.error('Failed to fetch active rounds:', err)
        if (!cancelled) {
          setError('Failed to load rounds')
          toast('error', 'Failed to load rounds')
        }
      })
    return () => { cancelled = true }
  }, [user, isDemo])

  useEffect(() => {
    return fetchRounds()
  }, [fetchRounds])

  const greeting = profile
    ? `Hey ${profile.display_name}`
    : user
      ? 'Welcome back'
      : null

  return (
    <div className="animate-fade-in min-h-dvh flex flex-col" style={{ backgroundColor: '#F5F0E8' }}>
      {/* Green header section */}
      <div className="w-full px-6 pt-8 pb-8 text-center" style={{ backgroundColor: '#2D4A3E' }}>
        <img src="/images/logo.webp" alt="Bogey Bookie" className="w-20 h-20 mx-auto mb-3 rounded-2xl" />
        <h1 className="text-3xl font-bold text-[#F5F0E8] tracking-tight italic">Bogey Bookie</h1>
        <p className="text-[#F5F0E8]/70 text-sm mt-1">Your golf bets, settled.</p>
        {greeting && (
          <p className="text-[#C4A962] text-sm font-medium mt-2">{greeting}</p>
        )}
        {authLoading && (
          <div className="h-4 w-28 mx-auto mt-2 bg-white/20 rounded animate-pulse" />
        )}
      </div>

      <div className="px-4 pb-4 max-w-lg mx-auto w-full space-y-5 -mt-4 relative z-10">
        {/* Primary CTA — green */}
        <button
          onClick={() => navigate('/round/new')}
          className="w-full py-4 rounded-xl font-bold text-lg text-[#F5F0E8]
            active:scale-[0.98] transition-transform duration-100
            focus-visible:ring-2 focus-visible:ring-[#2D4A3E] focus-visible:ring-offset-2
            tap-target uppercase tracking-wide"
          style={{ backgroundColor: '#2D4A3E' }}
        >
          Start New Game
        </button>

        {/* Secondary CTA — text link */}
        <button
          onClick={() => navigate('/round/join')}
          className="block mx-auto text-sm font-medium underline
            active:opacity-70 transition-opacity
            focus-visible:ring-2 focus-visible:ring-[#2D4A3E]
            tap-target"
          style={{ color: '#2D4A3E' }}
        >
          Join Existing Match
        </button>

        {/* Demo Link */}
        <button
          onClick={() => navigate('/round/demo')}
          className="block mx-auto py-1 px-6 tap-target text-sm
            transition-colors rounded-xl"
          style={{ color: '#2D4A3E', opacity: 0.5 }}
        >
          Try the demo round
        </button>

        {/* Active Rounds */}
        {activeRounds.length > 0 && (
          <div className="space-y-2.5">
            <h2 className="text-xs font-bold uppercase tracking-widest px-1" style={{ color: '#2D4A3E' }}>
              Recent Matches
            </h2>
            {activeRounds.map((round) => (
              <button
                key={round.id}
                onClick={() => navigate(`/round/${round.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl
                  bg-white border border-[#E8E3DA]
                  active:scale-[0.98] transition-all duration-150 text-left
                  focus-visible:ring-2 focus-visible:ring-[#2D4A3E]"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base truncate" style={{ color: '#2D4A3E' }}>
                    Skins: at {round.courses?.name || 'Unknown Course'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#2D4A3E', opacity: 0.5 }}>
                    {round.status === 'active' ? 'In progress' : 'Setting up'}
                  </p>
                </div>
                <ChevronRightIcon className="w-5 h-5 flex-shrink-0" style={{ color: '#2D4A3E', opacity: 0.4 }} />
              </button>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && activeRounds.length === 0 && (
          <div className="p-4 rounded-2xl bg-birdie-red/10 border border-birdie-red/20 text-center space-y-2">
            <p className="text-sm text-birdie-red font-medium">{error}</p>
            <Button variant="ghost" size="sm" onClick={() => fetchRounds()}>Retry</Button>
          </div>
        )}

        {/* Sign In Prompt */}
        {!user && !authLoading && (
          <div className="p-5 rounded-xl bg-white border border-[#E8E3DA] text-center space-y-3">
            <p className="text-sm" style={{ color: '#2D4A3E', opacity: 0.7 }}>
              Sign in to track rounds, stats, and settle up with your crew.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="secondary" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
              <Button variant="ghost" onClick={() => signInAsDemo()}>
                Demo Mode
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
