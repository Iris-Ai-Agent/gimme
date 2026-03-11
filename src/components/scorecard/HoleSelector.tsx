import React from 'react'

interface HoleSelectorProps {
  totalHoles: number
  currentHole: number
  scoredHoles: Set<number>
  onSelectHole: (hole: number) => void
}

export const HoleSelector = React.memo(function HoleSelector({ totalHoles, currentHole, scoredHoles, onSelectHole }: HoleSelectorProps) {
  const holes = Array.from({ length: totalHoles }, (_, i) => i + 1)

  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
        {holes.map((h) => {
          const isCurrent = h === currentHole
          const isScored = scoredHoles.has(h)
          let bg: string
          let border: string
          let color: string
          if (isCurrent) {
            bg = '#C4A962'
            border = '#C4A962'
            color = '#FFFFFF'
          } else if (isScored) {
            bg = '#2D4A3E'
            border = '#2D4A3E'
            color = '#F5F0E8'
          } else {
            bg = '#FFFFFF'
            border = '#E8E3DA'
            color = '#8A8578'
          }
          return (
            <button
              key={h}
              onClick={() => onSelectHole(h)}
              aria-label={`Hole ${h}${isScored ? ', scored' : ''}${isCurrent ? ', current' : ''}`}
              className="flex-shrink-0 w-10 h-10 rounded-full text-sm flex items-center justify-center transition-colors"
              style={{ backgroundColor: bg, border: `1px solid ${border}`, color, fontWeight: isCurrent ? 700 : 500 }}
            >
              {h}
            </button>
          )
        })}
      </div>
    </div>
  )
})
