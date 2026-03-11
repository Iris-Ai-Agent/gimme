import React from 'react'

interface PlayerTabsProps {
  players: { id: string; display_name: string }[]
  currentPlayerIdx: number
  onSelectPlayer: (idx: number) => void
}

export const PlayerTabs = React.memo(function PlayerTabs({ players, currentPlayerIdx, onSelectPlayer }: PlayerTabsProps) {
  if (players.length === 0) return null

  return (
    <div className="flex gap-2 mb-2">
      {players.map((p, idx) => (
        <button
          key={p.id}
          onClick={() => onSelectPlayer(idx)}
          className={`flex-1 py-2 rounded-xl text-sm font-medium tap-target transition-colors ${
            idx === currentPlayerIdx
              ? 'bg-masters-green text-white'
              : 'bg-rough dark:bg-night-border'
          }`}
        >
          {p.display_name}
        </button>
      ))}
    </div>
  )
})
