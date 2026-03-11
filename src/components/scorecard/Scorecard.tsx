import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import type { Score, Course, Profile } from '@/types/database'
import { getScoreDisplayClass } from '@/lib/score-colors'

interface ScorecardProps {
  course: Course
  players: Profile[]
  scores: Map<string, Score[]>
  currentHole: number
  onHoleSelect: (hole: number) => void
}

export const Scorecard = React.memo(function Scorecard({ course, players, scores, currentHole, onHoleSelect }: ScorecardProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showFade, setShowFade] = useState(true)
  const rafPending = useRef(false)

  const checkScroll = useCallback(() => {
    if (rafPending.current) return
    rafPending.current = true
    requestAnimationFrame(() => {
      rafPending.current = false
      const el = scrollRef.current
      if (!el) return
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1
      setShowFade(!atEnd)
    })
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    checkScroll()
    el.addEventListener('scroll', checkScroll, { passive: true })
    return () => el.removeEventListener('scroll', checkScroll)
  }, [checkScroll])

  // Pre-index scores: player -> hole -> score for O(1) lookups
  const indexedScores = useMemo(() => {
    const index = new Map<string, Map<number, Score>>()
    for (const [playerId, playerScores] of scores) {
      const holeMap = new Map<number, Score>()
      for (const s of playerScores) {
        holeMap.set(s.hole_number, s)
      }
      index.set(playerId, holeMap)
    }
    return index
  }, [scores])

  const totalFor = (playerId: string, start: number, end: number) => {
    const holeMap = indexedScores.get(playerId)
    if (!holeMap) return 0
    let sum = 0
    for (let h = start; h <= end; h++) {
      const s = holeMap.get(h)
      if (s) sum += s.strokes
    }
    return sum
  }

  const parTotal = (start: number, end: number) =>
    course.par.slice(start - 1, end).reduce((a, b) => a + b, 0)

  return (
    <div className="relative -mx-4">
      <div ref={scrollRef} className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-rough dark:border-night-border">
              <th className="sticky left-0 bg-fairway dark:bg-night px-3 py-2 text-left text-xs text-gray-500 w-24 z-10">Hole</th>
              {Array.from({ length: course.holes }, (_, i) => i + 1).map((h) => (
                <th
                  key={h}
                  role="button"
                  tabIndex={0}
                  onClick={() => onHoleSelect(h)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onHoleSelect(h)
                    }
                  }}
                  className={`px-2 py-2 text-center cursor-pointer min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-masters-green ${
                    h === currentHole ? 'bg-masters-green/10 text-masters-green font-bold' : 'text-gray-600'
                  }`}
                >
                  {h}
                </th>
              ))}
              <th className="px-2 py-2 text-center text-gray-500 font-bold">Tot</th>
            </tr>
            <tr className="border-b border-rough dark:border-night-border bg-rough/50 dark:bg-night-card/50">
              <td className="sticky left-0 bg-rough/50 dark:bg-night-card/50 px-3 py-1 text-xs text-gray-500">Par</td>
              {course.par.map((p, i) => (
                <td key={i} className="px-2 py-1 text-center text-xs text-gray-500">{p}</td>
              ))}
              <td className="px-2 py-1 text-center text-xs text-gray-500 font-bold">{parTotal(1, course.holes)}</td>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={player.id} className="border-b border-rough/50 dark:border-night-border/50">
                <td className="sticky left-0 bg-fairway dark:bg-night px-3 py-2 font-medium text-sm truncate max-w-[96px]">
                  {player.display_name}
                </td>
                {Array.from({ length: course.holes }, (_, i) => i + 1).map((h) => {
                  const score = indexedScores.get(player.id)?.get(h)
                  if (!score) return <td key={h} className="px-2 py-2 text-center text-gray-300">·</td>
                  const diff = score.strokes - course.par[h - 1]
                  const displayClass = getScoreDisplayClass(diff)
                  return (
                    <td key={h} className="px-2 py-2 text-center">
                      <span className={`inline-flex items-center justify-center w-7 h-7 text-sm ${displayClass}`}>
                        {score.strokes}
                      </span>
                    </td>
                  )
                })}
                <td className="px-2 py-2 text-center font-bold">
                  {totalFor(player.id, 1, course.holes) || '·'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showFade && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-fairway dark:from-night pointer-events-none" />
      )}
    </div>
  )
})
