import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScoreEntry } from '@/components/scorecard/ScoreEntry'
import { Scorecard } from '@/components/scorecard/Scorecard'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { Score, Course, Profile } from '@/types/database'
import { calculateSkins } from '@/lib/games/skins'
import { minimizeTransactions } from '@/lib/games/settlement'

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

export function DemoRoundPage() {
  const navigate = useNavigate()
  const [currentHole, setCurrentHole] = useState(1)
  const [currentPlayer, setCurrentPlayer] = useState(0)
  const [scores, setScores] = useState<Map<string, Score[]>>(new Map())
  const [view, setView] = useState<'score' | 'card' | 'settle'>('score')

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
    () => calculateSkins(scores, { skinValue: 5, carryover: true, useNet: false }, DEMO_COURSE.holes),
    [scores],
  )

  const settlements = useMemo(
    () => minimizeTransactions(skinsResult.payouts),
    [skinsResult],
  )

  const playerName = (id: string) => DEMO_PLAYERS.find((p) => p.id === id)?.display_name || id

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="tap-target text-gray-500">←</button>
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
                view === v ? 'bg-masters-green text-white' : 'bg-rough dark:bg-night-border text-gray-600'
              }`}
            >
              {v === 'score' ? '⛳' : v === 'card' ? '📋' : '💰'}
            </button>
          ))}
        </div>
      </div>

      {view === 'score' && (
        <div className="space-y-4">
          <div className="flex gap-1 overflow-x-auto pb-2">
            {Array.from({ length: DEMO_COURSE.holes }, (_, i) => i + 1).map((h) => {
              const allScored = DEMO_PLAYERS.every((p) =>
                (scores.get(p.id) || []).some((s) => s.hole_number === h)
              )
              return (
                <button
                  key={h}
                  onClick={() => { setCurrentHole(h); setCurrentPlayer(0) }}
                  className={`flex-shrink-0 w-9 h-9 rounded-full text-sm font-medium flex items-center justify-center ${
                    h === currentHole
                      ? 'bg-masters-green text-white'
                      : allScored
                        ? 'bg-masters-green/20 text-masters-green'
                        : 'bg-rough dark:bg-night-border text-gray-500'
                  }`}
                >
                  {h}
                </button>
              )
            })}
          </div>

          <div className="flex gap-2 mb-2">
            {DEMO_PLAYERS.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => setCurrentPlayer(idx)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium tap-target ${
                  idx === currentPlayer
                    ? 'bg-masters-green text-white'
                    : 'bg-rough dark:bg-night-border'
                }`}
              >
                {p.display_name}
              </button>
            ))}
          </div>

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
            <Card>
              <h3 className="text-sm font-semibold mb-2">Skins ($5/skin, carryover)</h3>
              <div className="space-y-1">
                {skinsResult.results
                  .filter((r) => r.winner)
                  .map((r) => (
                    <div key={r.hole} className="flex justify-between text-sm">
                      <span>Hole {r.hole}</span>
                      <span className="font-medium text-masters-green">
                        {playerName(r.winner!)} +${r.value}
                      </span>
                    </div>
                  ))}
              </div>
            </Card>
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
          <Card variant="elevated">
            <h3 className="font-semibold mb-3">Net Position</h3>
            <div className="space-y-2">
              {DEMO_PLAYERS.map((p) => {
                const amount = skinsResult.payouts.get(p.id) || 0
                return (
                  <div key={p.id} className="flex justify-between items-center">
                    <span className="font-medium">{p.display_name}</span>
                    <span className={`font-bold ${
                      amount > 0 ? 'text-masters-green' : amount < 0 ? 'text-birdie-red' : 'text-gray-400'
                    }`}>
                      {amount > 0 ? '+' : ''}{amount.toFixed(2)}
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>

          {settlements.length > 0 && (
            <Card variant="elevated">
              <h3 className="font-semibold mb-3">Settle Up</h3>
              <div className="space-y-3">
                {settlements.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-rough/50 dark:bg-night-border/50">
                    <div className="text-sm">
                      <span className="font-medium">{playerName(s.from)}</span>
                      <span className="text-gray-400 mx-2">→</span>
                      <span className="font-medium">{playerName(s.to)}</span>
                    </div>
                    <span className="font-bold text-lg">${s.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Button fullWidth variant="secondary" onClick={() => navigate('/')}>
            Finish Round
          </Button>
        </div>
      )}
    </div>
  )
}
