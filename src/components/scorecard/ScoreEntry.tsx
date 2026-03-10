import { useState } from 'react'

interface ScoreEntryProps {
  par: number
  currentScore: number | null
  onScore: (strokes: number) => void
  playerName: string
  holeNumber: number
}

const scoreLabels: Record<number, string> = {
  '-3': 'Albatross',
  '-2': 'Eagle',
  '-1': 'Birdie',
  '0': 'Par',
  '1': 'Bogey',
  '2': 'Double',
  '3': 'Triple',
}

function getScoreColor(diff: number): string {
  if (diff <= -2) return 'text-yellow-500'
  if (diff === -1) return 'text-birdie-red'
  if (diff === 0) return 'text-masters-green'
  if (diff === 1) return 'text-blue-500'
  return 'text-gray-500'
}

function getScoreBg(diff: number): string {
  if (diff <= -2) return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300'
  if (diff === -1) return 'bg-red-50 dark:bg-red-900/20 border-birdie-red'
  if (diff === 0) return 'bg-green-50 dark:bg-green-900/20 border-masters-green'
  if (diff === 1) return 'bg-blue-50 dark:bg-blue-900/20 border-blue-300'
  if (diff >= 2) return 'bg-gray-100 dark:bg-gray-800 border-gray-300'
  return 'bg-white dark:bg-night-card border-rough'
}

export function ScoreEntry({ par, currentScore, onScore, playerName, holeNumber }: ScoreEntryProps) {
  const [selected, setSelected] = useState<number | null>(currentScore)
  const options = Array.from({ length: 8 }, (_, i) => i + 1)

  function handleTap(strokes: number) {
    setSelected(strokes)
    onScore(strokes)
    if (navigator.vibrate) navigator.vibrate(10)
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
          const isSelected = selected === strokes
          const label = scoreLabels[String(diff) as keyof typeof scoreLabels]
          return (
            <button
              key={strokes}
              onClick={() => handleTap(strokes)}
              className={`
                flex flex-col items-center justify-center rounded-xl py-3 tap-target
                border-2 transition-all duration-100
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
                <span className={`text-[10px] font-medium mt-0.5 ${isSelected ? getScoreColor(diff) : 'text-gray-400'}`}>
                  {label}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
