import React from 'react'
import type { Debt } from '@/lib/games/settlement'
import { generateVenmoLink, generateCashAppLink } from '@/lib/games/settlement'

interface Player {
  id: string
  display_name: string
  venmo_handle?: string | null
  cashapp_handle?: string | null
}

interface SettleUpCardProps {
  settlements: Debt[]
  playerName: (id: string) => string
  players?: Player[]
}

export const SettleUpCard = React.memo(function SettleUpCard({ settlements, playerName, players }: SettleUpCardProps) {
  if (settlements.length === 0) return null

  const getPlayer = (id: string) => players?.find((p) => p.id === id)

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-widest px-1" style={{ color: '#2D4A3E' }}>Settle Up</h3>
      {settlements.map((s, i) => {
        const recipient = getPlayer(s.to)
        const venmo = recipient?.venmo_handle
        const cashapp = recipient?.cashapp_handle
        const note = `Bogey Bookie - ${playerName(s.from)} owes ${playerName(s.to)}`

        return (
          <div key={i} className="bg-white rounded-xl p-4 border space-y-3" style={{ borderColor: '#E8E3DA' }}>
            <div className="flex items-center justify-between">
              <div className="text-sm" style={{ color: '#2D4A3E' }}>
                <span className="font-medium">{playerName(s.from)}</span>
                <span className="mx-2" style={{ opacity: 0.4 }}>{'\u2192'}</span>
                <span className="font-medium">{playerName(s.to)}</span>
              </div>
              <span className="font-bold text-lg" style={{ color: '#2D4A3E' }}>${s.amount.toFixed(2)}</span>
            </div>
            {(venmo || cashapp) && (
              <div className="flex gap-2">
                {venmo && (
                  <a
                    href={generateVenmoLink(venmo, s.amount, note)}
                    className="flex-1 py-2 rounded-lg text-center text-sm font-bold tap-target transition-all active:scale-[0.97]"
                    style={{ backgroundColor: '#008CFF', color: '#FFFFFF' }}
                  >
                    Pay via Venmo
                  </a>
                )}
                {cashapp && (
                  <a
                    href={generateCashAppLink(cashapp, s.amount, note)}
                    className="flex-1 py-2 rounded-lg text-center text-sm font-bold tap-target transition-all active:scale-[0.97]"
                    style={{ backgroundColor: '#00D632', color: '#FFFFFF' }}
                  >
                    Pay via Cash App
                  </a>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
})
