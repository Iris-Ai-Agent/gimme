import React from 'react'
import { Card } from '@/components/ui/Card'
import type { SkinResult } from '@/lib/games/skins'

interface SkinsResultCardProps {
  results: SkinResult[]
  skinValue: number
  playerName: (id: string) => string
}

export const SkinsResultCard = React.memo(function SkinsResultCard({ results, skinValue, playerName }: SkinsResultCardProps) {
  const winners = results.filter((r) => r.winner)
  if (winners.length === 0) return null

  return (
    <Card>
      <h3 className="text-sm font-semibold mb-2">
        Skins (${skinValue}/skin, carryover)
      </h3>
      <div className="space-y-1">
        {winners.map((r) => (
          <div key={r.hole} className="flex justify-between text-sm">
            <span>Hole {r.hole}</span>
            <span className="font-medium text-masters-green dark:text-green-400">
              {playerName(r.winner!)} +${r.value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
})
