import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/stores/auth'

export function AuthPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signInWithEmail, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signInWithEmail(email)
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  async function handleGoogle() {
    const { error } = await signInWithGoogle()
    if (error) setError(error.message)
  }

  if (sent) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-5xl">📬</div>
          <h1 className="text-xl font-bold">Check your email</h1>
          <p className="text-gray-500">
            We sent a magic link to <strong>{email}</strong>. Tap it to sign in.
          </p>
          <Button variant="ghost" onClick={() => setSent(false)}>
            Try a different email
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-masters-green dark:text-gold">Gimme</h1>
          <p className="text-gray-500 mt-2">Score side games. Settle up.</p>
        </div>

        <div className="space-y-4">
          <Button fullWidth variant="ghost" className="border border-rough dark:border-night-border" onClick={handleGoogle}>
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-rough dark:bg-night-border" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-rough dark:bg-night-border" />
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-3 rounded-xl border border-rough dark:border-night-border bg-white dark:bg-night-card text-base focus:outline-none focus:ring-2 focus:ring-masters-green/50"
            />
            <Button fullWidth type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Magic Link'}
            </Button>
          </form>

          {error && <p className="text-birdie-red text-sm text-center">{error}</p>}
        </div>

        <button
          onClick={() => navigate('/')}
          className="block mx-auto text-sm text-gray-400 hover:text-gray-600"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
