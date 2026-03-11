import type { Score } from '@/types/database'

export function indexScoresByPlayerAndHole(scores: Map<string, Score[]>): Map<string, Map<number, Score>> {
  const indexed = new Map<string, Map<number, Score>>()
  scores.forEach((playerScores, playerId) => {
    const holeMap = new Map<number, Score>()
    for (const s of playerScores) {
      holeMap.set(s.hole_number, s)
    }
    indexed.set(playerId, holeMap)
  })
  return indexed
}
