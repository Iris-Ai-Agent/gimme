import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ScoreEntry } from '@/components/scorecard/ScoreEntry'
import { Scorecard } from '@/components/scorecard/Scorecard'
import { HoleSelector } from '@/components/scorecard/HoleSelector'
import { PlayerTabs } from '@/components/scorecard/PlayerTabs'
import { SkinsResultCard } from '@/components/scorecard/SkinsResultCard'
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
import { minimizeTransactions } from '@/lib/games/settlement'
import { getErrorMessage } from '@/lib/utils'
import { useRound } from '@/stores/round'
import { useAuth } from '@/stores/auth'
import { useSwipe } from '@/hooks/useSwipe'

export function RoundPage() {
  const { roundId } = useParams<{ roundId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    currentRound, course, players, playerProfiles, scores, games,
    loading, error, loadRound, postScore, completeRound, subscribeToRound, reset,
  } = useRound()

  const [currentHole, setCurrentHole] = useState(1)
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0)
  const [view, setView] = useState<'score' | 'card' | 'settle'>('score')
  const [posting, setPosting] = useState(false)
  const [showComplete, setShowComplete] = useState(false)
  const scoreSectionRef = useRef<HTMLDivElement>(null)

  const currentHoleRef = useRef(currentHole)
  const currentPlayerIdxRef = useRef(currentPlayerIdx)

  useEffect(() => { currentHoleRef.current = currentHole }, [currentHole])
  useEffect(() => { currentPlayerIdxRef.current = currentPlayerIdx }, [currentPlayerIdx])

  useEffect(() => {
    if (roundId) {
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
    return playerProfiles.length > 0
      ? playerProfiles
      : players.map((p) => ({
          id: p.profile_id,
          display_name: p.profile_id.slice(0, 8),
          avatar_url: null,
          handicap_index: null,
          venmo_handle: null,
          cashapp_handle: null,
          created_at: '',
        }))
  }, [players, playerProfiles])

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
    setPosting(true)
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
    } finally {
      setPosting(false)
    }
  }, [postScore])

  const skinsGame = games.find((g) => g.format === 'skins')
  const skinsConfig = useMemo(() => {
    if (!skinsGame) return null
    const c = skinsGame.config as Record<string, unknown>
    return {
      skinValue: (c.skinValue as number) || 5,
      carryover: (c.carryover as boolean) ?? true,
    }
  }, [skinsGame])

  const skinsResult = useMemo(() => {
    if (!skinsConfig || !course) return null
    return calculateSkins(scores, skinsConfig, course.holes)
  }, [scores, skinsConfig, course])

  const settlements = useMemo(() => {
    if (!skinsResult) return []
    return minimizeTransactions(skinsResult.payouts)
  }, [skinsResult])

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
      setView('settle')
    } catch (err) {
      toast('error', getErrorMessage(err, 'Failed to complete round'))
    }
  }

  if (loading && !currentRound) {
    return <PageSkeleton />
  }

  if (error && !currentRound) {
    return (
      <div className="px-4 pt-6 max-w-lg mx-auto text-center space-y-4">
        <p className="text-birdie-red">{error}</p>
        <Button variant="ghost" onClick={() => navigate('/')}>Go Home</Button>
      </div>
    )
  }

  if (!course || !currentRound) {
    return (
      <div className="px-4 pt-6 max-w-lg mx-auto text-center space-y-4">
        <p className="text-gray-500">Round not found</p>
        <Button variant="ghost" onClick={() => navigate('/')}>Go Home</Button>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto space-y-4 animate-fade-in safe-top">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-lg font-bold">{course.name}</h1>
            <p className="text-xs text-gray-500">
              Hole {currentHole} of {course.holes}
              {skinsConfig && ` · $${skinsConfig.skinValue} Skins`}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          {(['score', 'card', 'settle'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium tap-target transition-colors ${
                view === v ? 'bg-masters-green text-white' : 'bg-rough dark:bg-night-border text-gray-600 dark:text-gray-500'
              }`}
            >
              {v === 'score' ? 'Score' : v === 'card' ? 'Card' : 'Settle'}
            </button>
          ))}
        </div>
      </div>

      {/* Invite code banner */}
      {currentRound.status === 'active' && displayPlayers.length < 4 && (
        <div className="flex items-center justify-between bg-masters-green/10 dark:bg-masters-green/20 rounded-xl px-4 py-2.5">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-500">Invite code</p>
            <p className="font-mono font-bold text-masters-green tracking-wider">{currentRound.invite_code}</p>
          </div>
          <button
            onClick={() => shareInvite(currentRound.invite_code, 'round')}
            className="text-xs font-medium text-masters-green tap-target px-3 py-1.5 rounded-lg hover:bg-masters-green/10 transition-colors"
          >
            Share
          </button>
        </div>
      )}

      {view === 'score' && (
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
              holeNumber={currentHole}
            />
          )}

          {skinsResult && skinsResult.results.filter((r) => r.winner).length > 0 && (
            <SkinsResultCard
              results={skinsResult.results}
              skinValue={skinsConfig?.skinValue || 5}
              playerName={playerName}
            />
          )}

          {/* Complete round button */}
          {allHolesScored && currentRound.status === 'active' && user?.id === currentRound.created_by && (
            <Button fullWidth variant="secondary" onClick={() => setShowComplete(true)}>
              Complete Round
            </Button>
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

      {view === 'card' && (
        <Scorecard
          course={course}
          players={displayPlayers}
          scores={scores}
          currentHole={currentHole}
          onHoleSelect={(h) => { setCurrentHole(h); setCurrentPlayerIdx(0); setView('score') }}
        />
      )}

      {view === 'settle' && (
        <div className="space-y-4">
          {skinsResult ? (
            <>
              <NetPositionCard players={displayPlayers} payouts={skinsResult.payouts} />
              <SettleUpCard settlements={settlements} playerName={playerName} />
            </>
          ) : (
            <Card variant="elevated" className="text-center py-8">
              <p className="text-gray-500">Complete the round to see settlements.</p>
            </Card>
          )}

          <Button fullWidth variant="ghost" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
      )}
    </div>
  )
}
