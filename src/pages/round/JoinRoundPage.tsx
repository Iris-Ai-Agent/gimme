import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BackButton } from '@/components/ui/BackButton'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { toast } from '@/components/ui/Toast'
import { getErrorMessage } from '@/lib/utils'
import { useAuth } from '@/stores/auth'
import { useRound } from '@/stores/round'

export function JoinRoundPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { joinRound } = useRound()
  const [code, setCode] = useState(searchParams.get('code') || '')
  const [joining, setJoining] = useState(false)
  const codeValid = /^[a-zA-Z0-9]{8}$/.test(code)
  const codeError = code.length > 0 && !codeValid ? 'Code must be 8 alphanumeric characters' : ''

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return

    if (!user) {
      toast('info', 'Sign in first to join a round.')
      navigate('/auth')
      return
    }

    setJoining(true)
    try {
      const roundId = await joinRound(code.trim())
      toast('success', 'Joined the round!')
      navigate(`/round/${roundId}`)
    } catch (err) {
      toast('error', getErrorMessage(err, 'Failed to join round'))
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="min-h-dvh" style={{ backgroundColor: '#F5F0E8' }}>
    <div className="max-w-md mx-auto min-h-dvh shadow-lg flex flex-col animate-fade-in" style={{ backgroundColor: '#F5F0E8' }}>
      {/* Green header bar */}
      <div className="w-full px-4 py-4 flex items-center gap-3" style={{ backgroundColor: '#2D4A3E' }}>
        <BackButton />
        <h1 className="text-lg font-bold text-[#F5F0E8]">Join Match</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
        <div className="w-full max-w-sm bg-white rounded-2xl p-6 border shadow-sm space-y-5" style={{ borderColor: '#2D4A3E10' }}>
          <div className="text-center space-y-2">
            <p className="text-sm" style={{ color: '#2D4A3E', opacity: 0.6 }}>Enter the invite code from the round creator to join their game.</p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter code"
              autoFocus
              maxLength={8}
              className="px-4 py-4 border-2 text-center font-mono text-2xl tracking-[0.2em] border-[#2D4A3E]/30 focus:border-[#2D4A3E]"
            />
            {codeError && <p className="text-birdie-red text-xs mt-1">{codeError}</p>}
            <button
              type="submit"
              disabled={!codeValid || joining}
              className="w-full py-3.5 rounded-xl font-bold disabled:opacity-50
                transition-all active:scale-[0.98] tap-target uppercase tracking-wide"
              style={{ backgroundColor: '#C4A962', color: '#2D4A3E' }}
            >
              {joining ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner />
                  Joining...
                </span>
              ) : 'Join'}
            </button>
          </form>

          {!user && (
            <p className="text-xs text-center" style={{ color: '#2D4A3E', opacity: 0.5 }}>
              You'll need to sign in to join a round.
            </p>
          )}
        </div>
      </div>
    </div>
    </div>
  )
}
