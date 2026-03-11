import type { Score } from '@/types/database'
import { indexScoresByPlayerAndHole } from './index-scores'

export interface BBBConfig {
  pointValue: number
}

export interface BBBResult {
  hole: number
  points: Map<string, number>
}

export function calculateBBB(
  scores: Map<string, Score[]>,
  config: BBBConfig,
  totalHoles: number,
): { results: BBBResult[]; payouts: Map<string, number> } {
  const results: BBBResult[] = []
  const payouts = new Map<string, number>()
  const playerCount = scores.size

  if (playerCount === 0) {
    return { results, payouts }
  }

  const indexed = indexScoresByPlayerAndHole(scores)

  const totalPoints = new Map<string, number>()
  scores.forEach((_, playerId) => {
    totalPoints.set(playerId, 0)
  })

  for (let hole = 1; hole <= totalHoles; hole++) {
    const holePoints = new Map<string, number>()
    const holeScores: { playerId: string; strokes: number }[] = []

    indexed.forEach((holeMap, playerId) => {
      const holeScore = holeMap.get(hole)
      if (holeScore) {
        holeScores.push({ playerId, strokes: holeScore.strokes })
      }
    })

    if (holeScores.length === 0) {
      results.push({ hole, points: holePoints })
      continue
    }

    holeScores.sort((a, b) => a.strokes - b.strokes)

    const bestStrokes = holeScores[0].strokes
    const bestPlayers = holeScores.filter((s) => s.strokes === bestStrokes)

    if (bestPlayers.length === 1) {
      const winner = bestPlayers[0].playerId
      holePoints.set(winner, 2)
      totalPoints.set(winner, (totalPoints.get(winner) || 0) + 2)

      const remaining = holeScores.filter((s) => s.strokes !== bestStrokes)
      if (remaining.length > 0) {
        const secondStrokes = remaining[0].strokes
        const secondPlayers = remaining.filter((s) => s.strokes === secondStrokes)
        const secondPointShare = 1 / secondPlayers.length

        for (const p of secondPlayers) {
          holePoints.set(p.playerId, secondPointShare)
          totalPoints.set(p.playerId, (totalPoints.get(p.playerId) || 0) + secondPointShare)
        }
      }
    } else {
      const pointShare = 3 / bestPlayers.length

      for (const p of bestPlayers) {
        holePoints.set(p.playerId, pointShare)
        totalPoints.set(p.playerId, (totalPoints.get(p.playerId) || 0) + pointShare)
      }
    }

    results.push({ hole, points: holePoints })
  }

  const totalPointsAwarded = Array.from(totalPoints.values()).reduce((a, b) => a + b, 0)
  const perPlayerCost = (totalPointsAwarded * config.pointValue) / playerCount

  scores.forEach((_, playerId) => {
    const pts = totalPoints.get(playerId) || 0
    payouts.set(playerId, pts * config.pointValue - perPlayerCost)
  })

  return { results, payouts }
}
