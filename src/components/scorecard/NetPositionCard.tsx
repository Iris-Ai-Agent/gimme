import React from 'react'
import { Card } from '@/components/ui/Card'

interface NetPositionCardProps {
  players: { id: string; display_name: string }[]
  payouts: Map<string, number>
}

export const NetPositionCard = React.memo(function NetPositionCard({ players, payouts }: NetPositionCardProps) {
  return (
    <Card variant="elevated">
      <h3 className="font-semibold mb-3">Net Position</h3>
      <div className="space-y-2">
        {players.map((p) => {
          const amount = payouts.get(p.id) || 0
          return (
            <div key={p.id} className="flex justify-between items-center">
              <span className="font-medium">{p.display_name}</span>
              <span className={`font-bold ${
                amount > 0 ? 'text-masters-green dark:text-green-400' : amount < 0 ? 'text-birdie-red' : 'text-gray-400'
              }`}>
                {amount > 0 ? '+' : ''}{amount.toFixed(2)}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
})
