import React from 'react'
import { Card } from '@/components/ui/Card'
import type { Debt } from '@/lib/games/settlement'

interface SettleUpCardProps {
  settlements: Debt[]
  playerName: (id: string) => string
}

export const SettleUpCard = React.memo(function SettleUpCard({ settlements, playerName }: SettleUpCardProps) {
  if (settlements.length === 0) return null

  return (
    <Card variant="elevated">
      <h3 className="font-semibold mb-3">Settle Up</h3>
      <div className="space-y-3">
        {settlements.map((s, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-rough/50 dark:bg-night-border/50">
            <div className="text-sm">
              <span className="font-medium">{playerName(s.from)}</span>
              <span className="text-gray-400 mx-2">{'\u2192'}</span>
              <span className="font-medium">{playerName(s.to)}</span>
            </div>
            <span className="font-bold text-lg">${s.amount.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </Card>
  )
})
