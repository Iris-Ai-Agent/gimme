import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ScoreEntry } from '@/components/scorecard/ScoreEntry'
import { Scorecard } from '@/components/scorecard/Scorecard'
import { HoleSelector } from '@/components/scorecard/HoleSelector'
import { PlayerTabs } from '@/components/scorecard/PlayerTabs'
import { SkinsResultCard } from '@/components/scorecard/SkinsResultCard'
import { NassauResultCard, WolfResultCard, BBBResultCard } from '@/components/scorecard/GameResultCards'
import { NetPositionCard } from '@/components/scorecard/NetPositionCard'
import { SettleUpCard } from '@/components/scorecard/SettleUpCard'
import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Card } from '@/components/ui/Card'
import { PageSkeleton } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/Toast'
import { shareInvite } from '@/lib/share'
import { calculateSkins } from '@/lib/games/skins'
import { calculateNassau } from '@/lib/games/nassau'
import { calculateWolf } from '@/lib/games/wolf'
import { calculateBBB } from '@/lib/games/bingo-bango-bongo'
import { minimizeTransactions } from '@/lib/games/settlement'
import { getErrorMessage } from '@/lib/utils'
import { useRound } from '@/stores/round'
import { useAuth } from '@/stores/auth'
import { useSwipe } from '@/hooks/useSwipe'
import { FORMAT_LABELS } from '@/types/database'
import type { Game } from '@/types/database'

function getGameConfig(game: Game | undefined) {
  return (game?.config ?? {}) as Record<string, unknown>
}

function num(val: unknown, fallback: number): number {
  return typeof val === 'number' ? val : fallback
}

export function RoundPage() {
  const { roundId } = useParams<{ roundId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    currentRound, course, players, playerProfiles, scores, games,
    loading, error, loadRound, postScore, completeRound, subscribeToRound, syncPendingScores, reset,
  } = useRound()

  const [currentHole, setCurrentHole] = useState(1)
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0)
  const [view, setView] = useState<'game' | 'scorecard'>('game')
  const [showComplete, setShowComplete] = useState(false)
  const scoreSectionRef = useRef<HTMLDivElement>(null)

  const currentHoleRef = useRef(currentHole)
  const currentPlayerIdxRef = useRef(currentPlayerIdx)

  useEffect(() => { currentHoleRef.current = currentHole }, [currentHole])
  useEffect(() => { currentPlayerIdxRef.current = currentPlayerIdx }, [currentPlayerIdx])

  useEffect(() => {
    if (roundId) {
      syncPendingScores()
      loadRound(roundId)
      const unsub = subscribeToRound(roundId)
      return () => {
        unsub()
      }
    }
  }, [roundId, loadRound, subscribeToRound])

  // On unmount, reset round state
  useEffect(() => {
    return () => { reset() }
  }, [reset])

  const displayPlayers = useMemo(() => {
    if (playerProfiles.length > 0) return playerProfiles
    if (players.length > 0) return players.map((p) => ({
      id: p.profile_id,
      display_name: p.profile_id.slice(0, 8),
      avatar_url: null,
      handicap_index: null,
      venmo_handle: null,
      cashapp_handle: null,
      created_at: '',
    }))
    if (user) return [{
      id: user.id,
      display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'You',
      avatar_url: user.user_metadata?.avatar_url || null,
      handicap_index: null,
      venmo_handle: null,
      cashapp_handle: null,
      created_at: '',
    }]
    return []
  }, [players, playerProfiles, user])

  const currentPlayer = displayPlayers[currentPlayerIdx] || displayPlayers[0]

  const displayPlayersRef = useRef(displayPlayers)
  const courseRef = useRef(course)
  useEffect(() => { displayPlayersRef.current = displayPlayers }, [displayPlayers])
  useEffect(() => { courseRef.current = course }, [course])

  useSwipe(scoreSectionRef, {
    onLeft: useCallback(() => {
      const c = courseRef.current
      if (c && currentHoleRef.current < c.holes) {
        setCurrentHole((h) => h + 1)
        setCurrentPlayerIdx(0)
      }
    }, []),
    onRight: useCallback(() => {
      if (currentHoleRef.current > 1) {
        setCurrentHole((h) => h - 1)
        setCurrentPlayerIdx(0)
      }
    }, []),
  })

  const handleScore = useCallback(async (strokes: number) => {
    const players = displayPlayersRef.current
    const hole = currentHoleRef.current
    const playerIdx = currentPlayerIdxRef.current
    const c = courseRef.current
    const player = players[playerIdx] || players[0]
    if (!player) return
    try {
      await postScore(player.id, hole, strokes)
      if (playerIdx < players.length - 1) {
        setCurrentPlayerIdx(playerIdx + 1)
      } else if (c && hole < c.holes) {
        setCurrentPlayerIdx(0)
        setCurrentHole(hole + 1)
      }
    } catch (err) {
      toast('error', getErrorMessage(err, 'Failed to save score'))
    }
  }, [postScore])

  const gamesByFormat = useMemo(() => {
    const map = new Map(games.map((g) => [g.format, g]))
    return map
  }, [games])

  const skinsResult = useMemo(() => {
    const game = gamesByFormat.get('skins')
    if (!game || !course) return null
    const c = getGameConfig(game)
    return calculateSkins(scores, {
      skinValue: num(c.skinValue, 5),
      carryover: (c.carryover as boolean) ?? true,
    }, course.holes)
  }, [gamesByFormat, scores, course])

  const nassauConfig = useMemo(() => {
    const c = getGameConfig(gamesByFormat.get('nassau'))
    return {
      frontBet: num(c.frontBet, 5),
      backBet: num(c.backBet, 5),
      overallBet: num(c.overallBet, 5),
      useHandicap: false,
    }
  }, [gamesByFormat])

  const nassauResult = useMemo(() => {
    if (!gamesByFormat.has('nassau') || !course) return null
    return calculateNassau(scores, nassauConfig, course.holes)
  }, [gamesByFormat, scores, nassauConfig, course])

  const wolfResult = useMemo(() => {
    const game = gamesByFormat.get('wolf')
    if (!game || !course) return null
    return calculateWolf(scores, { pointValue: num(getGameConfig(game).pointValue, 5) }, course.holes)
  }, [gamesByFormat, scores, course])

  const bbbResult = useMemo(() => {
    const game = gamesByFormat.get('bingo_bango_bongo')
    if (!game || !course) return null
    return calculateBBB(scores, { pointValue: num(getGameConfig(game).pointValue, 1) }, course.holes)
  }, [gamesByFormat, scores, course])

  const combinedPayouts = useMemo(() => {
    const combined = new Map<string, number>()
    const merge = (payouts: Map<string, number>) => {
      payouts.forEach((amount, pid) => {
        combined.set(pid, (combined.get(pid) || 0) + amount)
      })
    }
    if (skinsResult) merge(skinsResult.payouts)
    if (nassauResult) merge(nassauResult.totalPayouts)
    if (wolfResult) merge(wolfResult.payouts)
    if (bbbResult) merge(bbbResult.payouts)
    return combined
  }, [skinsResult, nassauResult, wolfResult, bbbResult])

  const totalPot = useMemo(() =>
    Array.from(combinedPayouts.values()).reduce((sum, v) => sum + Math.max(0, v), 0),
  [combinedPayouts])

  const settlements = useMemo(() => {
    if (combinedPayouts.size === 0) return []
    return minimizeTransactions(combinedPayouts)
  }, [combinedPayouts])

  const scoredHoles = useMemo(() => {
    const set = new Set<number>()
    if (displayPlayers.length === 0 || !course) return set
    for (let h = 1; h <= course.holes; h++) {
      if (displayPlayers.every((p) => (scores.get(p.id) || []).some((s) => s.hole_number === h))) {
        set.add(h)
      }
    }
    return set
  }, [displayPlayers, scores, course])

  const allHolesScored = course ? scoredHoles.size === course.holes : false

  const playerName = useCallback((id: string) =>
    displayPlayers.find((p) => p.id === id)?.display_name || id.slice(0, 8),
  [displayPlayers])

  async function handleComplete() {
    try {
      await completeRound()
      toast('success', 'Round complete!')
      setView('scorecard')
    } catch (err) {
      toast('error', getErrorMessage(err, 'Failed to complete round'))
    }
  }

  if (loading && !currentRound) {
    return <PageSkeleton />
  }

  if (error && !currentRound) {
    return (
      <div className="min-h-dvh" style={{ backgroundColor: '#F5F0E8' }}>
        <div className="max-w-md mx-auto min-h-dvh shadow-lg px-4 pt-6 text-center space-y-4" style={{ backgroundColor: '#F5F0E8' }}>
          <p className="text-birdie-red">{error}</p>
          <Button variant="ghost" onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    )
  }

  if (!course || !currentRound) {
    return (
      <div className="min-h-dvh" style={{ backgroundColor: '#F5F0E8' }}>
        <div className="max-w-md mx-auto min-h-dvh shadow-lg px-4 pt-6 text-center space-y-4" style={{ backgroundColor: '#F5F0E8' }}>
          <p style={{ color: '#2D4A3E', opacity: 0.6 }}>Round not found</p>
          <Button variant="ghost" onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh" style={{ backgroundColor: '#F5F0E8' }}>
    <div className="max-w-md mx-auto min-h-dvh shadow-lg flex flex-col animate-fade-in" style={{ backgroundColor: '#F5F0E8' }}>
      {/* Green header bar */}
      <div className="w-full px-4 py-3" style={{ backgroundColor: '#2D4A3E' }}>
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-base font-bold text-[#F5F0E8]">{course.name}</h1>
            <p className="text-xs text-[#F5F0E8]/60">
              Hole {currentHole} · Par {course.par[currentHole - 1]}
              {games.length > 0 && ` · ${games.map((g) => FORMAT_LABELS[g.format] || g.format).join(', ')}`}
            </p>
          </div>
        </div>
      </div>

      {/* View tabs */}
      <div className="w-full flex border-b" style={{ borderColor: '#E8E3DA', backgroundColor: '#FFFFFF' }}>
        {(['game', 'scorecard'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="flex-1 py-3 text-sm tracking-wider tap-target transition-colors"
            style={{
              fontWeight: view === v ? 700 : 500,
              color: view === v ? '#2D4A3E' : '#2D4A3E99',
              borderBottom: view === v ? '3px solid #C4A962' : '3px solid transparent',
            }}
          >
            {v.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4 pb-24 max-w-lg mx-auto w-full space-y-4">
        {/* Invite code banner */}
        {currentRound.status === 'active' && (
          <div className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border" style={{ borderColor: '#2D4A3E20' }}>
            <div>
              <p className="text-xs" style={{ color: '#2D4A3E', opacity: 0.5 }}>Invite code</p>
              <p className="font-mono font-bold tracking-wider" style={{ color: '#2D4A3E' }}>{currentRound.invite_code}</p>
            </div>
            <button
              onClick={() => shareInvite(currentRound.invite_code, 'round')}
              className="text-xs font-bold tap-target px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: '#C4A962' }}
            >
              Share
            </button>
          </div>
        )}

        {view === 'game' && (
          <div ref={scoreSectionRef} className="space-y-4">
            <HoleSelector
              totalHoles={course.holes}
              currentHole={currentHole}
              scoredHoles={scoredHoles}
              onSelectHole={(h) => { setCurrentHole(h); setCurrentPlayerIdx(0) }}
            />

            <PlayerTabs
              players={displayPlayers}
              currentPlayerIdx={currentPlayerIdx}
              onSelectPlayer={setCurrentPlayerIdx}
            />

            {/* Score entry */}
            {currentPlayer && (
              <ScoreEntry
                par={course.par[currentHole - 1]}
                currentScore={
                  (scores.get(currentPlayer.id) || [])
                    .find((s) => s.hole_number === currentHole)?.strokes ?? null
                }
                onScore={handleScore}
                playerName={currentPlayer.display_name}

              />
            )}

            {skinsResult && skinsResult.results.filter((r) => r.winner).length > 0 && (
              <SkinsResultCard
                results={skinsResult.results}
                skinValue={num(getGameConfig(gamesByFormat.get('skins')).skinValue, 5)}
                playerName={playerName}
              />
            )}

            {nassauResult && (
              <NassauResultCard
                result={nassauResult}
                config={nassauConfig}
                playerName={playerName}
              />
            )}

            {wolfResult && wolfResult.results.filter((r) => r.winner).length > 0 && (
              <WolfResultCard
                results={wolfResult.results}
                pointValue={num(getGameConfig(gamesByFormat.get('wolf')).pointValue, 5)}
                playerName={playerName}
              />
            )}

            {bbbResult && bbbResult.results.length > 0 && (
              <BBBResultCard
                results={bbbResult.results}
                pointValue={num(getGameConfig(gamesByFormat.get('bingo_bango_bongo')).pointValue, 1)}
                playerName={playerName}
              />
            )}

            {/* Complete round button */}
            {allHolesScored && currentRound.status === 'active' && user?.id === currentRound.created_by && (
              <button
                onClick={() => setShowComplete(true)}
                className="w-full py-3.5 rounded-xl font-bold transition-all active:scale-[0.98] tap-target uppercase tracking-wide"
                style={{ backgroundColor: '#C4A962', color: '#2D4A3E' }}
              >
                Complete Round
              </button>
            )}

            {/* Next Hole button */}
            {course && currentHole < course.holes && !allHolesScored && (
              <button
                onClick={() => { setCurrentHole(currentHole + 1); setCurrentPlayerIdx(0) }}
                className="w-full py-3.5 rounded-xl font-bold transition-all active:scale-[0.98] tap-target uppercase tracking-wide"
                style={{ backgroundColor: '#C4A962', color: '#2D4A3E' }}
              >
                Next Hole →
              </button>
            )}

            <ConfirmDialog
              open={showComplete}
              onConfirm={() => { setShowComplete(false); handleComplete() }}
              onCancel={() => setShowComplete(false)}
              title="Complete Round?"
              description="This will finalize scores and calculate settlements. This can't be undone."
              confirmText="Complete Round"
              confirmVariant="danger"
            />
          </div>
        )}

        {view === 'scorecard' && (
          <div className="space-y-4">
            <Scorecard
              course={course}
              players={displayPlayers}
              scores={scores}
              currentHole={currentHole}
              onHoleSelect={(h) => { setCurrentHole(h); setCurrentPlayerIdx(0); setView('game') }}
            />

            {/* Settlement section — shown when round is complete */}
            {currentRound.status === 'complete' && combinedPayouts.size > 0 && (
              <>
                {totalPot > 0 && (
                  <div className="text-center py-4">
                    <p className="text-xs uppercase tracking-wider font-medium" style={{ color: '#2D4A3E99' }}>Total Pot</p>
                    <p className="text-4xl font-bold" style={{ color: '#2D4A3E' }}>${totalPot}</p>
                  </div>
                )}

                <NetPositionCard players={displayPlayers} payouts={combinedPayouts} />
                <SettleUpCard settlements={settlements} playerName={playerName} players={displayPlayers} />
              </>
            )}

            {currentRound.status !== 'complete' && (
              <Card variant="elevated" className="text-center py-8 bg-white">
                <p style={{ color: '#2D4A3E', opacity: 0.6 }}>Complete the round to see settlements.</p>
              </Card>
            )}

            <Button fullWidth variant="ghost" onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </div>
        )}
      </div>
    </div>
    </div>
  )
}
