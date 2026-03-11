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
import { Button } from '@/components/ui/Button'
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
  const [view, setView] = useState<'score' | 'card' | 'settle'>('score')
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
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto space-y-4 safe-top animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-lg font-bold">{DEMO_COURSE.name}</h1>
            <p className="text-xs text-gray-500">Hole {currentHole} of {DEMO_COURSE.holes} · $5 Skins</p>
          </div>
        </div>
        <div className="flex gap-1">
          {(['score', 'card', 'settle'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium tap-target ${
                view === v ? 'bg-masters-green text-white' : 'bg-rough dark:bg-night-border text-gray-600 dark:text-gray-400'
              }`}
            >
              {v === 'score' ? 'Score' : v === 'card' ? 'Card' : 'Settle'}
            </button>
          ))}
        </div>
      </div>

      {view === 'score' && (
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
            holeNumber={currentHole}
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

      {view === 'card' && (
        <Scorecard
          course={DEMO_COURSE}
          players={DEMO_PLAYERS}
          scores={scores}
          currentHole={currentHole}
          onHoleSelect={(h) => { setCurrentHole(h); setCurrentPlayer(0); setView('score') }}
        />
      )}

      {view === 'settle' && (
        <div className="space-y-4">
          <NetPositionCard players={DEMO_PLAYERS} payouts={skinsResult.payouts} />
          <SettleUpCard settlements={settlements} playerName={playerName} />

          <Button fullWidth variant="secondary" onClick={() => navigate('/')}>
            Finish Round
          </Button>
        </div>
      )}
    </div>
  )
}
