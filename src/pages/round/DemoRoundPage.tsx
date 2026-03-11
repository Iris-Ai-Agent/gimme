import { useState, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScoreEntry } from '@/components/scorecard/ScoreEntry'
import { Scorecard } from '@/components/scorecard/Scorecard'
import { HoleSelector } from '@/components/scorecard/HoleSelector'
import { PlayerTabs } from '@/components/scorecard/PlayerTabs'
import { SkinsResultCard } from '@/components/scorecard/SkinsResultCard'
import { NetPositionCard } from '@/components/scorecard/NetPositionCard'
import { SettleUpCard } from '@/components/scorecard/SettleUpCard'
import { BackButton } from '@/components/ui/BackButton'
import type { Score, Course, Profile } from '@/types/database'
import { calculateSkins } from '@/lib/games/skins'
import { minimizeTransactions } from '@/lib/games/settlement'
import { useSwipe } from '@/hooks/useSwipe'

const DEMO_COURSE: Course = {
  id: 'demo',
  name: 'Demo Course',
  holes: 9,
  par: [4, 3, 5, 4, 4, 3, 5, 4, 4],
  created_by: 'demo',
}

const DEMO_PLAYERS: Profile[] = [
  { id: 'p1', display_name: 'You', avatar_url: null, handicap_index: null, venmo_handle: null, cashapp_handle: null, created_at: '' },
  { id: 'p2', display_name: 'Jake', avatar_url: null, handicap_index: null, venmo_handle: 'jake', cashapp_handle: null, created_at: '' },
  { id: 'p3', display_name: 'Mike', avatar_url: null, handicap_index: null, venmo_handle: 'mike', cashapp_handle: null, created_at: '' },
]

const playerName = (id: string) => DEMO_PLAYERS.find((p) => p.id === id)?.display_name || id

export function DemoRoundPage() {
  const navigate = useNavigate()
  const [currentHole, setCurrentHole] = useState(1)
  const [currentPlayer, setCurrentPlayer] = useState(0)
  const [scores, setScores] = useState<Map<string, Score[]>>(new Map())
  const [view, setView] = useState<'game' | 'scorecard'>('game')
  const scoreSectionRef = useRef<HTMLDivElement>(null)

  useSwipe(scoreSectionRef, {
    onLeft: useCallback(() => {
      setCurrentHole((h) => (h < DEMO_COURSE.holes ? h + 1 : h))
      setCurrentPlayer(0)
    }, []),
    onRight: useCallback(() => {
      setCurrentHole((h) => (h > 1 ? h - 1 : h))
      setCurrentPlayer(0)
    }, []),
  })

  function handleScore(strokes: number) {
    const player = DEMO_PLAYERS[currentPlayer]
    const updated = new Map(scores)
    const playerScores = [...(updated.get(player.id) || [])]
    const idx = playerScores.findIndex((s) => s.hole_number === currentHole)
    const score: Score = {
      id: `${player.id}-${currentHole}`,
      round_id: 'demo',
      profile_id: player.id,
      hole_number: currentHole,
      strokes,
      updated_at: new Date().toISOString(),
    }
    if (idx >= 0) playerScores[idx] = score
    else playerScores.push(score)
    updated.set(player.id, playerScores)
    setScores(updated)

    if (currentPlayer < DEMO_PLAYERS.length - 1) {
      setCurrentPlayer(currentPlayer + 1)
    } else if (currentHole < DEMO_COURSE.holes) {
      setCurrentPlayer(0)
      setCurrentHole(currentHole + 1)
    }
  }

  const skinsResult = useMemo(
    () => calculateSkins(scores, { skinValue: 5, carryover: true }, DEMO_COURSE.holes),
    [scores],
  )

  const settlements = useMemo(
    () => minimizeTransactions(skinsResult.payouts),
    [skinsResult],
  )

  const scoredHoles = useMemo(() => {
    const set = new Set<number>()
    for (let h = 1; h <= DEMO_COURSE.holes; h++) {
      if (DEMO_PLAYERS.every((p) => (scores.get(p.id) || []).some((s) => s.hole_number === h))) {
        set.add(h)
      }
    }
    return set
  }, [scores])

  return (
    <div className="min-h-dvh" style={{ backgroundColor: '#F5F0E8' }}>
    <div className="max-w-md mx-auto min-h-dvh shadow-lg flex flex-col animate-fade-in" style={{ backgroundColor: '#F5F0E8' }}>
      {/* Green header bar */}
      <div className="w-full px-4 py-4 flex items-center justify-between" style={{ backgroundColor: '#2D4A3E' }}>
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-base font-bold text-[#F5F0E8]">{DEMO_COURSE.name}</h1>
            <p className="text-xs text-[#F5F0E8]/60">
              Hole {currentHole} · Par {DEMO_COURSE.par[currentHole - 1]} · $5 Skins · Demo
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
        {view === 'game' && (
          <div ref={scoreSectionRef} className="space-y-4">
            <HoleSelector
              totalHoles={DEMO_COURSE.holes}
              currentHole={currentHole}
              scoredHoles={scoredHoles}
              onSelectHole={(h) => { setCurrentHole(h); setCurrentPlayer(0) }}
            />

            <PlayerTabs
              players={DEMO_PLAYERS}
              currentPlayerIdx={currentPlayer}
              onSelectPlayer={setCurrentPlayer}
            />

            <ScoreEntry
              par={DEMO_COURSE.par[currentHole - 1]}
              currentScore={
                (scores.get(DEMO_PLAYERS[currentPlayer].id) || [])
                  .find((s) => s.hole_number === currentHole)?.strokes ?? null
              }
              onScore={handleScore}
              playerName={DEMO_PLAYERS[currentPlayer].display_name}
            />

            {skinsResult.results.filter((r) => r.winner || r.carryover).length > 0 && (
              <SkinsResultCard
                results={skinsResult.results}
                skinValue={5}
                playerName={playerName}
              />
            )}
          </div>
        )}

        {view === 'scorecard' && (
          <div className="space-y-4">
            <Scorecard
              course={DEMO_COURSE}
              players={DEMO_PLAYERS}
              scores={scores}
              currentHole={currentHole}
              onHoleSelect={(h) => { setCurrentHole(h); setCurrentPlayer(0); setView('game') }}
            />

            {Array.from(skinsResult.payouts.values()).some((v) => v !== 0) && (
              <>
                <NetPositionCard players={DEMO_PLAYERS} payouts={skinsResult.payouts} />
                <SettleUpCard settlements={settlements} playerName={playerName} players={DEMO_PLAYERS} />
              </>
            )}

            <button
              onClick={() => navigate('/')}
              className="w-full py-3.5 rounded-xl font-bold transition-all active:scale-[0.98] tap-target uppercase tracking-wide"
              style={{ backgroundColor: '#2D4A3E', color: '#F5F0E8' }}
            >
              Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
    </div>
  )
}
