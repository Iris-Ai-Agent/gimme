import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackButton } from '@/components/ui/BackButton'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { toast } from '@/components/ui/Toast'
import { shareInvite } from '@/lib/share'
import { getErrorMessage } from '@/lib/utils'
import { db } from '@/lib/supabase'
import { useAuth } from '@/stores/auth'
import { useRound } from '@/stores/round'
import type { GameFormat } from '@/types/database'

function WagerPicker({ label, options, value, onChange }: {
  label: string
  options: number[]
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="mb-3">
      <p className="text-xs font-medium mb-1.5" style={{ color: '#2D4A3E', opacity: 0.7 }}>{label}</p>
      <div className="flex gap-2">
        {options.map((v) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className="flex-1 py-2 rounded-lg font-medium text-sm tap-target transition-colors"
            style={{
              backgroundColor: value === v ? '#2D4A3E' : '#2D4A3E10',
              color: value === v ? '#F5F0E8' : '#2D4A3E',
            }}
          >
            ${v}
          </button>
        ))}
      </div>
    </div>
  )
}

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
  const [courseName, setCourseName] = useState('')
  const [holes, setHoles] = useState(18)
  const [selectedGames, setSelectedGames] = useState<Set<GameFormat>>(new Set())
  const [skinValue, setSkinValue] = useState(5)
  const [nassauBet, setNassauBet] = useState(5)
  const [wolfValue, setWolfValue] = useState(5)
  const [bbbValue, setBbbValue] = useState(1)
  const [creating, setCreating] = useState(false)
  const [createdRound, setCreatedRound] = useState<{ id: string; inviteCode: string } | null>(null)
  const [crews, setCrews] = useState<{ id: string; name: string }[]>([])
  const [selectedCrewId, setSelectedCrewId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    db.from('crew_members')
      .select('crew_id, crews(id, name)')
      .eq('profile_id', user.id)
      .then(({ data }: any) => {
        if (!cancelled && data) setCrews(data.map((r: any) => r.crews).filter(Boolean))
      })
    return () => { cancelled = true }
  }, [user])
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
        if (format === 'wolf') {
          config.pointValue = wolfValue
        }
        if (format === 'bingo_bango_bongo') {
          config.pointValue = bbbValue
        }
        return { format, config }
      })

      const roundId = await createRound({
        courseName,
        pars,
        games: gameDefs,
        crewId: selectedCrewId || undefined,
      })

      const { currentRound } = useRound.getState()
      setCreatedRound({ id: roundId, inviteCode: currentRound?.invite_code || '' })
    } catch (err) {
      toast('error', getErrorMessage(err, 'Failed to create round'))
    } finally {
      setCreating(false)
    }
  }

  if (createdRound) {
    return (
      <div className="min-h-dvh" style={{ backgroundColor: '#F5F0E8' }}>
        <div className="max-w-md mx-auto min-h-dvh shadow-lg flex flex-col animate-fade-in" style={{ backgroundColor: '#F5F0E8' }}>
          <div className="w-full px-4 py-4 flex items-center gap-3" style={{ backgroundColor: '#2D4A3E' }}>
            <h1 className="text-lg font-bold text-[#F5F0E8] italic">Bogey Bookie</h1>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center px-6 space-y-8">
            <div className="text-center space-y-2">
              <p className="text-5xl">⛳</p>
              <h2 className="text-2xl font-bold" style={{ color: '#2D4A3E' }}>Match Created!</h2>
              <p className="text-sm" style={{ color: '#2D4A3E', opacity: 0.6 }}>
                Share the code below to invite players
              </p>
            </div>

            <div className="w-full bg-white rounded-2xl p-6 border text-center space-y-4" style={{ borderColor: '#E8E3DA' }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#2D4A3E', opacity: 0.5 }}>Invite Code</p>
              <p className="text-4xl font-mono font-bold tracking-[0.3em]" style={{ color: '#2D4A3E' }}>
                {createdRound.inviteCode}
              </p>
              <button
                onClick={() => shareInvite(createdRound.inviteCode, 'round')}
                className="w-full py-3 rounded-xl font-bold transition-all active:scale-[0.98] tap-target"
                style={{ backgroundColor: '#C4A962', color: '#2D4A3E' }}
              >
                Share Invite Link
              </button>
            </div>

            <button
              onClick={() => navigate(`/round/${createdRound.id}`)}
              className="w-full py-3.5 rounded-xl font-bold transition-all active:scale-[0.98] tap-target"
              style={{ backgroundColor: '#2D4A3E', color: '#F5F0E8' }}
            >
              Start Playing
            </button>

            <p className="text-xs text-center" style={{ color: '#2D4A3E', opacity: 0.4 }}>
              Players can join anytime during the round
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh" style={{ backgroundColor: '#F5F0E8' }}>
    <div className="max-w-md mx-auto min-h-dvh shadow-lg flex flex-col animate-fade-in" style={{ backgroundColor: '#F5F0E8' }}>
      {/* Green header bar */}
      <div className="w-full px-4 py-4 flex items-center gap-3" style={{ backgroundColor: '#2D4A3E' }}>
        <BackButton />
        <h1 className="text-lg font-bold text-[#F5F0E8] italic">Bogey Bookie</h1>
      </div>

      <div className="px-4 pt-6 pb-4 w-full space-y-6">
        <h2 className="text-2xl font-bold" style={{ color: '#2D4A3E' }}>New Match</h2>

        <div className="space-y-5 animate-fade-in">
          {/* Course Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#2D4A3E' }}>Course Name</label>
            <Input
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g. Pebble Beach"
              autoFocus
              maxLength={100}
            />
            {courseNameError && <p className="text-birdie-red text-xs mt-1">{courseNameError}</p>}
          </div>

          {/* Holes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#2D4A3E' }}>Holes</label>
            <div className="flex gap-3">
              {[9, 18].map((h) => (
                <button
                  key={h}
                  onClick={() => setHoles(h)}
                  className="flex-1 py-3 rounded-xl font-semibold tap-target transition-all"
                  style={{
                    border: `1px solid ${holes === h ? '#2D4A3E' : '#E8E3DA'}`,
                    backgroundColor: holes === h ? '#2D4A3E' : '#FFFFFF',
                    color: holes === h ? '#F5F0E8' : '#2D4A3E',
                  }}
                >
                  {h} Holes
                </button>
              ))}
            </div>
          </div>

          {/* Game Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#2D4A3E' }}>Game</label>
            <div className="flex flex-col gap-2">
              {GAME_OPTIONS.map((game) => (
                <button
                  key={game.format}
                  onClick={() => toggleGame(game.format)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all
                    active:scale-[0.97] tap-target"
                  style={{
                    border: `1px solid ${selectedGames.has(game.format) ? '#2D4A3E' : '#E8E3DA'}`,
                    backgroundColor: selectedGames.has(game.format) ? '#2D4A3E' : '#FFFFFF',
                  }}
                >
                  <span className="text-xl">{game.emoji}</span>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: selectedGames.has(game.format) ? '#F5F0E8' : '#2D4A3E' }}>{game.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: selectedGames.has(game.format) ? '#F5F0E8' : '#2D4A3E', opacity: selectedGames.has(game.format) ? 0.7 : 0.5 }}>{game.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Wager */}
          {selectedGames.size > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#2D4A3E' }}>WAGER</label>

              {selectedGames.has('skins') && (
                <WagerPicker label="Skin Value ($)" options={[1, 2, 5, 10, 20]} value={skinValue} onChange={setSkinValue} />
              )}
              {selectedGames.has('nassau') && (
                <WagerPicker label="Nassau Bet ($)" options={[2, 5, 10, 20, 50]} value={nassauBet} onChange={setNassauBet} />
              )}
              {selectedGames.has('wolf') && (
                <WagerPicker label="Wolf Point Value ($)" options={[1, 2, 5, 10, 20]} value={wolfValue} onChange={setWolfValue} />
              )}
              {selectedGames.has('bingo_bango_bongo') && (
                <WagerPicker label="BBB Point Value ($)" options={[1, 2, 5, 10, 20]} value={bbbValue} onChange={setBbbValue} />
              )}
            </div>
          )}

          {/* Crew picker */}
          {crews.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#2D4A3E' }}>Crew (optional)</label>
              <div className="flex flex-wrap gap-2">
                {crews.map((crew) => (
                  <button
                    key={crew.id}
                    onClick={() => setSelectedCrewId(selectedCrewId === crew.id ? null : crew.id)}
                    className="px-4 py-2 rounded-xl text-sm font-medium tap-target transition-all"
                    style={{
                      border: `1px solid ${selectedCrewId === crew.id ? '#2D4A3E' : '#E8E3DA'}`,
                      backgroundColor: selectedCrewId === crew.id ? '#2D4A3E' : '#FFFFFF',
                      color: selectedCrewId === crew.id ? '#F5F0E8' : '#2D4A3E',
                    }}
                  >
                    {crew.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Players */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#2D4A3E' }}>Players</label>
            <p className="text-sm" style={{ color: '#2D4A3E', opacity: 0.5 }}>Invite players after creating the game.</p>
          </div>

          {/* NEXT button */}
          <button
            onClick={handleStart}
            disabled={!courseName.trim() || !!courseNameError || selectedGames.size === 0 || creating}
            className="w-full py-3.5 rounded-xl font-bold disabled:opacity-50
              transition-all active:scale-[0.98] tap-target"
            style={{ backgroundColor: '#2D4A3E', color: '#F5F0E8' }}
          >
            {creating ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner />
                Creating...
              </span>
            ) : (
              'Next'
            )}
          </button>

          {!user && (
            <p className="text-xs text-center" style={{ color: '#2D4A3E', opacity: 0.5 }}>
              Not signed in — you'll be taken to the demo round.
            </p>
          )}
        </div>
      </div>
    </div>
    </div>
  )
}
