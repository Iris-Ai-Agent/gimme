import React from 'react'

interface NetPositionCardProps {
  players: { id: string; display_name: string }[]
  payouts: Map<string, number>
}

export const NetPositionCard = React.memo(function NetPositionCard({ players, payouts }: NetPositionCardProps) {
  const sorted = [...players].sort((a, b) => (payouts.get(b.id) || 0) - (payouts.get(a.id) || 0))

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-widest px-1" style={{ color: '#2D4A3E' }}>Net Position</h3>
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E8E3DA' }}>
        {sorted.map((p, i) => {
          const amount = payouts.get(p.id) || 0
          return (
            <div
              key={p.id}
              className="flex justify-between items-center px-4 py-3"
              style={{ borderTop: i > 0 ? '1px solid #E8E3DA' : undefined }}
            >
              <span className="font-medium text-sm" style={{ color: '#2D4A3E' }}>{p.display_name}</span>
              <span
                className="font-bold"
                style={{ color: amount > 0 ? '#2D7A3E' : amount < 0 ? '#C44A4A' : '#8A8578' }}
              >
                {amount > 0 ? '+' : ''}${amount.toFixed(2)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
})
