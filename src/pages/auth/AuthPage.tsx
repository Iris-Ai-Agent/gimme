import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/stores/auth'

export function AuthPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { user, signInWithEmail, signInWithGoogle, signInAsDemo } = useAuth()
  const navigate = useNavigate()

  // Redirect to home if already signed in
  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const [emailTouched, setEmailTouched] = useState(false)
  const emailError = emailTouched && email.length > 0 && !emailValid ? 'Enter a valid email address' : ''

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    setEmailTouched(true)
    if (!emailValid) {
      setError('Enter a valid email address')
      return
    }
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
      <div className="min-h-dvh" style={{ backgroundColor: '#F5F0E8' }}>
        <div className="max-w-md mx-auto min-h-dvh shadow-lg flex items-center justify-center px-4 animate-fade-in safe-top" style={{ backgroundColor: '#F5F0E8' }}>
          <div className="text-center space-y-4 max-w-sm">
            <div className="text-5xl">📬</div>
            <h1 className="text-xl font-bold" style={{ color: '#2D4A3E' }}>Check your email</h1>
            <p style={{ color: '#2D4A3E', opacity: 0.6 }}>
              We sent a magic link to <strong>{email}</strong>. Tap it to sign in.
            </p>
            <button
              onClick={() => setSent(false)}
              className="text-sm font-medium"
              style={{ color: '#C4A962' }}
            >
              Try a different email
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh" style={{ backgroundColor: '#F5F0E8' }}>
      <div className="max-w-md mx-auto min-h-dvh shadow-lg flex flex-col animate-fade-in safe-top" style={{ backgroundColor: '#F5F0E8' }}>
        {/* Green top branding section */}
        <div className="w-full px-6 pt-12 pb-12 text-center" style={{ backgroundColor: '#2D4A3E' }}>
          <img src="/images/logo.webp" alt="Bogey Bookie" className="w-24 h-24 mx-auto mb-4 rounded-2xl" />
          <h1 className="text-3xl font-bold text-[#F5F0E8] tracking-tight italic">Bogey Bookie</h1>
          <p className="text-[#F5F0E8]/70 text-sm mt-1">Your golf bets, settled.</p>
        </div>

        {/* Cream card area */}
        <div className="flex-1 flex flex-col items-center px-4 pt-6">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 space-y-5">
            <h2 className="text-xl font-bold text-center" style={{ color: '#2D4A3E' }}>
              Sign In
            </h2>

            <form onSubmit={handleEmail} className="space-y-3">
              <Input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailTouched(true) }}
                placeholder="your@email.com"
                autoComplete="email"
                required
                className="border-[#2D4A3E]/30 focus:border-[#2D4A3E]"
              />
              {emailError && <p className="text-birdie-red text-xs mt-1">{emailError}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-[#F5F0E8] disabled:opacity-50
                  transition-all active:scale-[0.98] tap-target"
                style={{ backgroundColor: '#2D4A3E' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner />
                    Creating...
                  </span>
                ) : 'Continue with Email'}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ backgroundColor: '#2D4A3E', opacity: 0.15 }} />
              <span className="text-xs" style={{ color: '#2D4A3E', opacity: 0.4 }}>or</span>
              <div className="flex-1 h-px" style={{ backgroundColor: '#2D4A3E', opacity: 0.15 }} />
            </div>

            {/* Google */}
            <button
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm
                border-2 transition-all active:scale-[0.98] tap-target"
              style={{ borderColor: '#2D4A3E', color: '#2D4A3E' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button>

            {error && <p className="text-birdie-red text-sm text-center">{error}</p>}
          </div>

          {/* Skip to Demo button */}
          <button
            onClick={() => { signInAsDemo(); navigate('/round/demo', { replace: true }) }}
            className="w-full max-w-sm mt-5 py-4 rounded-xl font-bold text-lg
              transition-all active:scale-[0.98] tap-target"
            style={{ backgroundColor: '#2D4A3E', color: '#F5F0E8' }}
          >
            Skip to Demo
          </button>
        </div>
      </div>
    </div>
  )
}
