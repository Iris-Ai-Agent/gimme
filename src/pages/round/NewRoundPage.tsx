import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { toast } from '@/components/ui/Toast'
import { getErrorMessage } from '@/lib/utils'
import { useAuth } from '@/stores/auth'
import { useRound } from '@/stores/round'
import type { GameFormat } from '@/types/database'

const DEFAULT_PARS_9 = [4, 4, 3, 5, 4, 3, 4, 5, 4]
const DEFAULT_PARS_18 = [4, 4, 3, 5, 4, 3, 4, 5, 4, 4, 4, 3, 5, 4, 3, 4, 5, 4]

const GAME_OPTIONS: { format: GameFormat; name: string; desc: string; emoji: string }[] = [
  { format: 'nassau', name: 'Nassau', desc: 'Front 9 / Back 9 / Overall', emoji: '🏆' },
  { format: 'skins', name: 'Skins', desc: 'Win each hole outright', emoji: '💀' },
  { format: 'wolf', name: 'Wolf', desc: 'Pick your partner each hole', emoji: '🐺' },
  { format: 'bingo_bango_bongo', name: 'Bingo Bango Bongo', desc: '3 points per hole', emoji: '🎯' },
]

export function NewRoundPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { createRound } = useRound()
  const [step, setStep] = useState<'course' | 'games'>('course')
  const [courseName, setCourseName] = useState('')
  const [holes, setHoles] = useState(18)
  const [selectedGames, setSelectedGames] = useState<Set<GameFormat>>(new Set())
  const [skinValue, setSkinValue] = useState(5)
  const [nassauBet, setNassauBet] = useState(5)
  const [creating, setCreating] = useState(false)
  const courseNameError = courseName.length > 0 && courseName.trim().length === 0
    ? 'Course name cannot be blank'
    : courseName.trim().length > 100
      ? 'Course name must be 100 characters or less'
      : ''

  function toggleGame(format: GameFormat) {
    const next = new Set(selectedGames)
    if (next.has(format)) next.delete(format)
    else next.add(format)
    setSelectedGames(next)
  }

  async function handleStart() {
    if (!user) {
      toast('info', 'Sign in to create a round with Supabase, or try the demo.')
      navigate('/round/demo')
      return
    }

    setCreating(true)
    try {
      const pars = holes === 9 ? DEFAULT_PARS_9 : DEFAULT_PARS_18
      const gameDefs = Array.from(selectedGames).map((format) => {
        const config: Record<string, unknown> = {}
        if (format === 'skins') {
          config.skinValue = skinValue
          config.carryover = true
        }
        if (format === 'nassau') {
          config.frontBet = nassauBet
          config.backBet = nassauBet
          config.overallBet = nassauBet
        }
        return { format, config }
      })

      const roundId = await createRound({
        courseName,
        pars,
        games: gameDefs,
      })

      toast('success', 'Round created! Share the invite code.')
      navigate(`/round/${roundId}`)
    } catch (err) {
      toast('error', getErrorMessage(err, 'Failed to create round'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-6 animate-fade-in safe-top">
      <div className="flex items-center gap-3">
        <BackButton />
        <h1 className="text-xl font-bold">New Round</h1>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1">
        {['course', 'games'].map((s, i) => (
          <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${
            (['course', 'games'].indexOf(step) >= i) ? 'bg-masters-green' : 'bg-rough dark:bg-night-border'
          }`} />
        ))}
      </div>

      {step === 'course' && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <label className="block text-sm font-medium mb-1">Course Name</label>
            <Input
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g. Pebble Beach"
              autoFocus
              maxLength={100}
            />
            {courseNameError && <p className="text-birdie-red text-xs mt-1">{courseNameError}</p>}
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
                      : 'border-rough dark:border-night-border hover:border-masters-green/30'
                  }`}
                >
                  {h} Holes
                </button>
              ))}
            </div>
          </div>

          <Button fullWidth onClick={() => setStep('games')} disabled={!courseName.trim() || !!courseNameError}>
            Next: Pick Games
          </Button>
        </div>
      )}

      {step === 'games' && (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-3">
            {GAME_OPTIONS.map((game) => (
              <Card
                key={game.format}
                className={`cursor-pointer transition-all ${
                  selectedGames.has(game.format) ? 'border-masters-green ring-1 ring-masters-green/30' : 'hover:border-masters-green/30'
                }`}
                onClick={() => toggleGame(game.format)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{game.emoji}</span>
                  <div className="flex-1">
                    <div className="font-semibold">{game.name}</div>
                    <div className="text-sm text-gray-500">{game.desc}</div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedGames.has(game.format)
                      ? 'border-masters-green bg-masters-green text-white'
                      : 'border-gray-300'
                  }`}>
                    {selectedGames.has(game.format) && (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
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
                    className={`flex-1 py-2 rounded-lg font-medium text-sm tap-target transition-colors ${
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
                    className={`flex-1 py-2 rounded-lg font-medium text-sm tap-target transition-colors ${
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
            <Button variant="ghost" onClick={() => setStep('course')} className="flex-1">
              Back
            </Button>
            <Button
              onClick={handleStart}
              disabled={selectedGames.size === 0 || creating}
              className="flex-1"
            >
              {creating ? (
                <span className="flex items-center gap-2">
                  <Spinner />
                  Creating...
                </span>
              ) : (
                'Start Round'
              )}
            </Button>
          </div>

          {!user && (
            <p className="text-xs text-center text-gray-500">
              Not signed in — you'll be taken to the demo round.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
