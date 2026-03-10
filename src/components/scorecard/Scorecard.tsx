import type { Score, Course, Profile } from '@/types/database'

interface ScorecardProps {
  course: Course
  players: Profile[]
  scores: Map<string, Score[]>
  currentHole: number
  onHoleSelect: (hole: number) => void
}

function getScoreDisplay(strokes: number, par: number): { text: string; className: string } {
  const diff = strokes - par
  if (diff <= -2) return { text: String(strokes), className: 'bg-yellow-400 text-white rounded-full' }
  if (diff === -1) return { text: String(strokes), className: 'text-birdie-red font-bold' }
  if (diff === 0) return { text: String(strokes), className: 'text-masters-green' }
  if (diff === 1) return { text: String(strokes), className: 'text-blue-500' }
  if (diff === 2) return { text: String(strokes), className: 'text-orange-500' }
  return { text: String(strokes), className: 'text-gray-500' }
}

export function Scorecard({ course, players, scores, currentHole, onHoleSelect }: ScorecardProps) {
  const totalFor = (playerId: string, start: number, end: number) => {
    const playerScores = scores.get(playerId) || []
    return playerScores
      .filter((s) => s.hole_number >= start && s.hole_number <= end)
      .reduce((sum, s) => sum + s.strokes, 0)
  }

  const parTotal = (start: number, end: number) =>
    course.par.slice(start - 1, end).reduce((a, b) => a + b, 0)

  return (
    <div className="overflow-x-auto -mx-4">
      <table className="w-full text-sm min-w-[600px]">
        <thead>
          <tr className="border-b border-rough dark:border-night-border">
            <th className="sticky left-0 bg-fairway dark:bg-night px-3 py-2 text-left text-xs text-gray-500 w-24">Hole</th>
            {Array.from({ length: course.holes }, (_, i) => i + 1).map((h) => (
              <th
                key={h}
                onClick={() => onHoleSelect(h)}
                className={`px-2 py-2 text-center cursor-pointer min-w-[36px] ${
                  h === currentHole ? 'bg-masters-green/10 text-masters-green font-bold' : 'text-gray-600'
                }`}
              >
                {h}
              </th>
            ))}
            <th className="px-2 py-2 text-center text-gray-500 font-bold">Tot</th>
          </tr>
          <tr className="border-b border-rough dark:border-night-border bg-rough/50 dark:bg-night-card/50">
            <td className="sticky left-0 bg-rough/50 dark:bg-night-card/50 px-3 py-1 text-xs text-gray-500">Par</td>
            {course.par.map((p, i) => (
              <td key={i} className="px-2 py-1 text-center text-xs text-gray-500">{p}</td>
            ))}
            <td className="px-2 py-1 text-center text-xs text-gray-500 font-bold">{parTotal(1, course.holes)}</td>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player.id} className="border-b border-rough/50 dark:border-night-border/50">
              <td className="sticky left-0 bg-fairway dark:bg-night px-3 py-2 font-medium text-sm truncate max-w-[96px]">
                {player.display_name}
              </td>
              {Array.from({ length: course.holes }, (_, i) => i + 1).map((h) => {
                const score = (scores.get(player.id) || []).find((s) => s.hole_number === h)
                if (!score) return <td key={h} className="px-2 py-2 text-center text-gray-300">·</td>
                const display = getScoreDisplay(score.strokes, course.par[h - 1])
                return (
                  <td key={h} className="px-2 py-2 text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 text-sm ${display.className}`}>
                      {display.text}
                    </span>
                  </td>
                )
              })}
              <td className="px-2 py-2 text-center font-bold">
                {totalFor(player.id, 1, course.holes) || '·'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
