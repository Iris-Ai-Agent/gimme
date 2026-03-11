import React from 'react'

interface PlayerTabsProps {
  players: { id: string; display_name: string }[]
  currentPlayerIdx: number
  onSelectPlayer: (idx: number) => void
}

export const PlayerTabs = React.memo(function PlayerTabs({ players, currentPlayerIdx, onSelectPlayer }: PlayerTabsProps) {
  if (players.length === 0) return null

  return (
    <div className="flex gap-1 mb-2">
      {players.map((p, idx) => {
        const isActive = idx === currentPlayerIdx
        return (
          <button
            key={p.id}
            onClick={() => onSelectPlayer(idx)}
            className="flex-1 flex items-center justify-center tap-target transition-colors"
            style={{
              padding: '10px 8px',
              borderBottom: isActive ? '3px solid #C4A962' : '3px solid transparent',
            }}
          >
            <span
              className="text-sm truncate"
              style={{ fontWeight: isActive ? 700 : 400, color: isActive ? '#2D4A3E' : '#8A8578' }}
            >
              {p.display_name}
            </span>
          </button>
        )
      })}
    </div>
  )
})
