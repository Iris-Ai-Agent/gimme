import { useEffect, type RefObject } from 'react'

interface SwipeHandlers {
  onLeft?: () => void
  onRight?: () => void
  threshold?: number
}

export function useSwipe(ref: RefObject<HTMLElement | null>, { onLeft, onRight, threshold = 50 }: SwipeHandlers) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let startX = 0
    let startY = 0

    function handleStart(e: TouchEvent) {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }

    function handleEnd(e: TouchEvent) {
      const dx = e.changedTouches[0].clientX - startX
      const dy = e.changedTouches[0].clientY - startY
      if (Math.abs(dx) < (threshold ?? 50) || Math.abs(dy) > Math.abs(dx)) return
      if (dx < 0) onLeft?.()
      else onRight?.()
    }

    el.addEventListener('touchstart', handleStart, { passive: true })
    el.addEventListener('touchend', handleEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', handleStart)
      el.removeEventListener('touchend', handleEnd)
    }
  }, [ref, onLeft, onRight, threshold])
}
