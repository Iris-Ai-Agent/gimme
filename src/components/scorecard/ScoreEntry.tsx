import { memo } from 'react'
import { getScoreColor, getScoreBg, getScoreLabel } from '@/lib/score-colors'

interface ScoreEntryProps {
  par: number
  currentScore: number | null
  onScore: (strokes: number) => void
  playerName: string
  holeNumber: number
}

export const ScoreEntry = memo(function ScoreEntry({ par, currentScore, onScore, playerName, holeNumber }: ScoreEntryProps) {
  const options = Array.from({ length: 8 }, (_, i) => i + 1)

  function handleTap(strokes: number) {
    if (navigator.vibrate) navigator.vibrate(10)
    onScore(strokes)
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-sm text-gray-500">Hole {holeNumber}</span>
          <span className="mx-2 text-gray-300">·</span>
          <span className="text-sm font-medium">Par {par}</span>
        </div>
        <span className="font-semibold">{playerName}</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {options.map((strokes) => {
          const diff = strokes - par
          const isSelected = currentScore === strokes
          const label = getScoreLabel(diff)
          return (
            <button
              key={strokes}
              onClick={() => handleTap(strokes)}
              aria-label={`${strokes} stroke${strokes !== 1 ? 's' : ''}${label ? `, ${label}` : ''}${isSelected ? ', selected' : ''}`}
              className={`
                flex flex-col items-center justify-center rounded-xl py-3 tap-target
                border-2 transition-all duration-100 active:scale-95
                ${isSelected
                  ? `${getScoreBg(diff)} border-2 scale-105`
                  : 'bg-white dark:bg-night-card border-rough dark:border-night-border hover:border-masters-green/30'
                }
              `}
            >
              <span className={`text-2xl font-bold ${isSelected ? getScoreColor(diff) : ''}`}>
                {strokes}
              </span>
              {label && (
                <span className={`text-[10px] font-medium mt-0.5 ${isSelected ? getScoreColor(diff) : 'text-gray-500'}`}>
                  {label}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
})
