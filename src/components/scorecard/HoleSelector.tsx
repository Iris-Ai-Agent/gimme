import React from 'react'

interface HoleSelectorProps {
  totalHoles: number
  currentHole: number
  scoredHoles: Set<number>
  onSelectHole: (hole: number) => void
}

export const HoleSelector = React.memo(function HoleSelector({ totalHoles, currentHole, scoredHoles, onSelectHole }: HoleSelectorProps) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
      {Array.from({ length: totalHoles }, (_, i) => i + 1).map((h) => (
        <button
          key={h}
          onClick={() => onSelectHole(h)}
          aria-label={`Hole ${h}${scoredHoles.has(h) ? ', scored' : ''}${h === currentHole ? ', current' : ''}`}
          className={`flex-shrink-0 w-11 h-11 rounded-full text-sm font-medium flex items-center justify-center transition-colors ${
            h === currentHole
              ? 'bg-masters-green text-white'
              : scoredHoles.has(h)
                ? 'bg-masters-green/20 text-masters-green'
                : 'bg-rough dark:bg-night-border text-gray-500'
          }`}
        >
          {h}
        </button>
      ))}
    </div>
  )
})
