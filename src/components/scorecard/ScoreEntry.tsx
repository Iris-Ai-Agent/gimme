import { memo } from 'react'

interface ScoreEntryProps {
  par: number
  currentScore: number | null
  onScore: (strokes: number) => void
  playerName: string
}

export const ScoreEntry = memo(function ScoreEntry({ par, currentScore, onScore, playerName }: ScoreEntryProps) {
  const options = Array.from({ length: 8 }, (_, i) => i + 1)

  function handleTap(strokes: number) {
    if (navigator.vibrate) navigator.vibrate(10)
    onScore(strokes)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-base font-bold" style={{ color: '#2D4A3E' }}>{playerName}</p>
        <p className="text-sm font-medium" style={{ color: '#2D4A3E', opacity: 0.5 }}>Par {par}</p>
      </div>

      <div className="grid grid-cols-4 gap-2.5">
        {options.map((strokes) => {
          const isSelected = currentScore === strokes
          return (
            <button
              key={strokes}
              onClick={() => handleTap(strokes)}
              aria-label={`${strokes} stroke${strokes !== 1 ? 's' : ''}${isSelected ? ', selected' : ''}`}
              className="flex items-center justify-center rounded-xl tap-target transition-all duration-100 active:scale-95"
              style={{
                padding: '14px 0',
                minHeight: '64px',
                backgroundColor: isSelected ? '#2D4A3E' : '#FFFFFF',
                border: `1px solid ${isSelected ? '#2D4A3E' : '#E8E3DA'}`,
              }}
            >
              <span className="text-2xl font-bold" style={{ color: isSelected ? '#FFFFFF' : '#2D4A3E' }}>
                {strokes}
              </span>
            </button>
          )
        })}
      </div>
      {currentScore !== null && (
        <p className="text-center text-xs mt-1" style={{ color: '#8A8578' }}>tap to change</p>
      )}
    </div>
  )
})
