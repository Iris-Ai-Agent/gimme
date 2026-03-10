import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { GameFormat } from '@/types/database'

const DEFAULT_PARS = [4, 4, 3, 5, 4, 3, 4, 5, 4, 4, 4, 3, 5, 4, 3, 4, 5, 4]

const GAME_OPTIONS: { format: GameFormat; name: string; desc: string; emoji: string }[] = [
  { format: 'nassau', name: 'Nassau', desc: 'Front 9 / Back 9 / Overall', emoji: '🏆' },
  { format: 'skins', name: 'Skins', desc: 'Win each hole outright', emoji: '💀' },
  { format: 'wolf', name: 'Wolf', desc: 'Pick your partner each hole', emoji: '🐺' },
  { format: 'bingo_bango_bongo', name: 'Bingo Bango Bongo', desc: '3 points per hole', emoji: '🎯' },
]

export function NewRoundPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'course' | 'players' | 'games'>('course')
  const [courseName, setCourseName] = useState('')
  const [holes, setHoles] = useState(18)
  const [players, setPlayers] = useState<string[]>([''])
  const [selectedGames, setSelectedGames] = useState<Set<GameFormat>>(new Set())
  const [skinValue, setSkinValue] = useState(5)
  const [nassauBet, setNassauBet] = useState(5)

  function toggleGame(format: GameFormat) {
    const next = new Set(selectedGames)
    if (next.has(format)) next.delete(format)
    else next.add(format)
    setSelectedGames(next)
  }

  function addPlayer() {
    setPlayers([...players, ''])
  }

  function updatePlayer(idx: number, name: string) {
    const next = [...players]
    next[idx] = name
    setPlayers(next)
  }

  function removePlayer(idx: number) {
    setPlayers(players.filter((_, i) => i !== idx))
  }

  function handleStart() {
    // TODO: create round in Supabase, navigate to scorecard
    navigate('/round/demo')
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="tap-target text-gray-500">←</button>
        <h1 className="text-xl font-bold">New Round</h1>
      </div>

      <div className="flex gap-1">
        {['course', 'players', 'games'].map((s, i) => (
          <div key={s} className={`flex-1 h-1.5 rounded-full ${
            (['course', 'players', 'games'].indexOf(step) >= i) ? 'bg-masters-green' : 'bg-rough dark:bg-night-border'
          }`} />
        ))}
      </div>

      {step === 'course' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Course Name</label>
            <input
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g. Pebble Beach"
              className="w-full px-4 py-3 rounded-xl border border-rough dark:border-night-border bg-white dark:bg-night-card focus:outline-none focus:ring-2 focus:ring-masters-green/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Holes</label>
            <div className="flex gap-3">
              {[9, 18].map((h) => (
                <button
                  key={h}
                  onClick={() => setHoles(h)}
                  className={`flex-1 py-3 rounded-xl font-semibold tap-target border-2 transition-all ${
                    holes === h
                      ? 'border-masters-green bg-masters-green/10 text-masters-green'
                      : 'border-rough dark:border-night-border'
                  }`}
                >
                  {h} Holes
                </button>
              ))}
            </div>
          </div>

          <Button fullWidth onClick={() => setStep('players')} disabled={!courseName}>
            Next: Add Players
          </Button>
        </div>
      )}

      {step === 'players' && (
        <div className="space-y-4">
          <div className="space-y-3">
            {players.map((name, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  value={name}
                  onChange={(e) => updatePlayer(idx, e.target.value)}
                  placeholder={`Player ${idx + 1}`}
                  className="flex-1 px-4 py-3 rounded-xl border border-rough dark:border-night-border bg-white dark:bg-night-card focus:outline-none focus:ring-2 focus:ring-masters-green/50"
                />
                {players.length > 1 && (
                  <button onClick={() => removePlayer(idx)} className="tap-target text-gray-400 hover:text-birdie-red px-2">
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {players.length < 8 && (
            <button
              onClick={addPlayer}
              className="w-full py-3 rounded-xl border-2 border-dashed border-rough dark:border-night-border text-gray-400 hover:border-masters-green hover:text-masters-green transition-colors tap-target"
            >
              + Add Player
            </button>
          )}

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep('course')} className="flex-1">
              Back
            </Button>
            <Button onClick={() => setStep('games')} disabled={players.filter(Boolean).length < 2} className="flex-1">
              Next: Games
            </Button>
          </div>
        </div>
      )}

      {step === 'games' && (
        <div className="space-y-4">
          <div className="space-y-3">
            {GAME_OPTIONS.map((game) => (
              <Card
                key={game.format}
                className={`cursor-pointer transition-all ${
                  selectedGames.has(game.format) ? 'border-masters-green ring-1 ring-masters-green/30' : ''
                }`}
                onClick={() => toggleGame(game.format)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{game.emoji}</span>
                  <div className="flex-1">
                    <div className="font-semibold">{game.name}</div>
                    <div className="text-sm text-gray-500">{game.desc}</div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedGames.has(game.format)
                      ? 'border-masters-green bg-masters-green text-white'
                      : 'border-gray-300'
                  }`}>
                    {selectedGames.has(game.format) && '✓'}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {selectedGames.has('skins') && (
            <Card>
              <label className="block text-sm font-medium mb-2">Skin Value ($)</label>
              <div className="flex gap-2">
                {[1, 2, 5, 10, 20].map((v) => (
                  <button
                    key={v}
                    onClick={() => setSkinValue(v)}
                    className={`flex-1 py-2 rounded-lg font-medium text-sm tap-target ${
                      skinValue === v ? 'bg-masters-green text-white' : 'bg-rough dark:bg-night-border'
                    }`}
                  >
                    ${v}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {selectedGames.has('nassau') && (
            <Card>
              <label className="block text-sm font-medium mb-2">Nassau Bet ($)</label>
              <div className="flex gap-2">
                {[2, 5, 10, 20, 50].map((v) => (
                  <button
                    key={v}
                    onClick={() => setNassauBet(v)}
                    className={`flex-1 py-2 rounded-lg font-medium text-sm tap-target ${
                      nassauBet === v ? 'bg-masters-green text-white' : 'bg-rough dark:bg-night-border'
                    }`}
                  >
                    ${v}
                  </button>
                ))}
              </div>
            </Card>
          )}

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep('players')} className="flex-1">
              Back
            </Button>
            <Button onClick={handleStart} disabled={selectedGames.size === 0} className="flex-1">
              Start Round ⛳
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
