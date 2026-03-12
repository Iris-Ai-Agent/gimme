import React from 'react'
import { Card } from '@/components/ui/Card'
import type { NassauResult } from '@/lib/games/nassau'
import type { WolfResult } from '@/lib/games/wolf'
import type { BBBResult } from '@/lib/games/bingo-bango-bongo'

interface Props {
  playerName: (id: string) => string
}

interface NassauProps extends Props {
  result: NassauResult
  config: { frontBet: number; backBet: number; overallBet: number }
}

export const NassauResultCard = React.memo(function NassauResultCard({ result, config, playerName }: NassauProps) {
  const sections = [
    { label: 'Front 9', payouts: result.front, bet: config.frontBet },
    { label: 'Back 9', payouts: result.back, bet: config.backBet },
    { label: 'Overall', payouts: result.overall, bet: config.overallBet },
  ]

  return (
    <Card>
      <h3 className="text-sm font-semibold mb-2">Nassau</h3>
      <div className="space-y-2">
        {sections.map((s) => {
          const winner = Array.from(s.payouts.entries()).find(([, v]) => v > 0)
          return (
            <div key={s.label} className="flex justify-between text-sm">
              <span style={{ color: '#2D4A3E', opacity: 0.7 }}>{s.label} (${s.bet})</span>
              <span className="font-medium" style={{ color: winner ? '#2D4A3E' : '#8a8578' }}>
                {winner ? `${playerName(winner[0])} +$${winner[1]}` : 'Tied'}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
})

interface WolfProps extends Props {
  results: WolfResult[]
  pointValue: number
}

export const WolfResultCard = React.memo(function WolfResultCard({ results, pointValue, playerName }: WolfProps) {
  const winners = results.filter((r) => r.winner)
  if (winners.length === 0) return null

  return (
    <Card>
      <h3 className="text-sm font-semibold mb-2">
        Wolf (${pointValue}/pt)
      </h3>
      <div className="space-y-1">
        {winners.map((r) => (
          <div key={r.hole} className="flex justify-between text-sm">
            <span>Hole {r.hole} {r.winner === r.wolf ? '🐺' : ''}</span>
            <span className="font-medium" style={{ color: '#2D4A3E' }}>
              {playerName(r.winner!)} +${r.value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
})

interface BBBProps extends Props {
  results: BBBResult[]
  pointValue: number
}

export const BBBResultCard = React.memo(function BBBResultCard({ results, pointValue, playerName }: BBBProps) {
  const totals = new Map<string, number>()
  for (const r of results) {
    r.points.forEach((pts, pid) => {
      totals.set(pid, (totals.get(pid) || 0) + pts)
    })
  }

  const sorted = Array.from(totals.entries()).sort((a, b) => b[1] - a[1])
  if (sorted.length === 0) return null

  return (
    <Card>
      <h3 className="text-sm font-semibold mb-2">
        Bingo Bango Bongo (${pointValue}/pt)
      </h3>
      <div className="space-y-1">
        {sorted.map(([pid, pts]) => (
          <div key={pid} className="flex justify-between text-sm">
            <span>{playerName(pid)}</span>
            <span className="font-medium" style={{ color: '#2D4A3E' }}>
              {pts.toFixed(pts % 1 === 0 ? 0 : 1)} pts · ${(pts * pointValue).toFixed(0)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
})
