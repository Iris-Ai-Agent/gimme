import { useEffect, useState, useCallback, useRef } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'pwa-install-dismissed-at'
const VISIT_KEY = 'pwa-visit-count'
const DISMISS_DAYS = 7

export function InstallPrompt() {
  const [show, setShow] = useState(false)
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const visits = parseInt(localStorage.getItem(VISIT_KEY) || '0', 10) + 1
    localStorage.setItem(VISIT_KEY, String(visits))

    if (visits < 2) return

    const dismissedAt = localStorage.getItem(DISMISS_KEY)
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10)
      if (elapsed < DISMISS_DAYS * 24 * 60 * 60 * 1000) return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e as BeforeInstallPromptEvent
      setShow(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setShow(false)
    deferredPrompt.current = null
  }, [])

  const install = useCallback(async () => {
    const prompt = deferredPrompt.current
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      setShow(false)
    } else {
      dismiss()
    }
    deferredPrompt.current = null
  }, [dismiss])

  if (!show) return null

  return (
    <div
      className="fixed bottom-16 left-0 right-0 z-50 flex justify-center px-4 pb-2 animate-fade-in"
    >
      <div
        className="max-w-md w-full flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg"
        style={{ backgroundColor: '#2D4A3E', border: '1px solid #C4A962' }}
      >
        <p className="flex-1 text-sm font-medium" style={{ color: '#F5F0E8' }}>
          Add Bogey Bookie to your home screen
        </p>
        <button
          onClick={install}
          className="rounded-lg px-3 py-1.5 text-sm font-bold whitespace-nowrap transition-opacity active:opacity-80"
          style={{ backgroundColor: '#C4A962', color: '#2D4A3E' }}
        >
          Install
        </button>
        <button
          onClick={dismiss}
          className="text-lg leading-none px-1 transition-opacity active:opacity-60"
          style={{ color: '#F5F0E8' }}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  )
}
