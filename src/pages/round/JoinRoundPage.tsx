import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
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
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-6 animate-fade-in safe-top">
      <div className="flex items-center gap-3">
        <BackButton />
        <h1 className="text-xl font-bold">Join Round</h1>
      </div>

      <Card variant="elevated" className="space-y-4">
        <div className="text-center space-y-2">
          <span className="text-4xl">🔗</span>
          <p className="text-sm text-gray-500">Enter the invite code from the round creator to join their game.</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter code"
            autoFocus
            maxLength={8}
            className="px-4 py-4 border-2 text-center font-mono text-2xl tracking-[0.2em] focus:border-masters-green"
          />
          {codeError && <p className="text-birdie-red text-xs mt-1">{codeError}</p>}
          <Button fullWidth type="submit" disabled={!codeValid || joining}>
            {joining ? (
              <span className="flex items-center gap-2">
                <Spinner />
                Joining...
              </span>
            ) : 'Join Round'}
          </Button>
        </form>

        {!user && (
          <p className="text-xs text-center text-gray-500">
            You'll need to sign in to join a round.
          </p>
        )}
      </Card>
    </div>
  )
}
