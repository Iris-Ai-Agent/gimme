import type { Score } from '@/types/database'
import { indexScoresByPlayerAndHole } from './index-scores'

export interface WolfConfig {
  pointValue: number
}

export interface WolfResult {
  hole: number
  wolf: string
  winner: string | null
  value: number
}

export function calculateWolf(
  scores: Map<string, Score[]>,
  config: WolfConfig,
  totalHoles: number,
): { results: WolfResult[]; payouts: Map<string, number> } {
  const results: WolfResult[] = []
  const payouts = new Map<string, number>()
  const players = Array.from(scores.keys())
  const playerCount = players.length

  if (playerCount === 0) {
    return { results, payouts }
  }

  const indexed = indexScoresByPlayerAndHole(scores)

  for (let hole = 1; hole <= totalHoles; hole++) {
    const wolfIndex = (hole - 1) % playerCount
    const wolf = players[wolfIndex]

    let bestScore = Infinity
    let bestPlayers: string[] = []

    indexed.forEach((holeMap, playerId) => {
      const holeScore = holeMap.get(hole)
      if (!holeScore) return
      if (holeScore.strokes < bestScore) {
        bestScore = holeScore.strokes
        bestPlayers = [playerId]
      } else if (holeScore.strokes === bestScore) {
        bestPlayers.push(playerId)
      }
    })

    if (bestPlayers.length === 1) {
      const winner = bestPlayers[0]
      const isWolf = winner === wolf
      const value = isWolf ? config.pointValue * 2 : config.pointValue
      results.push({ hole, wolf, winner, value })
      payouts.set(winner, (payouts.get(winner) || 0) + value)
    } else {
      results.push({ hole, wolf, winner: null, value: 0 })
    }
  }

  const totalWon = Array.from(payouts.values()).reduce((a, b) => a + b, 0)
  const perPlayerCost = totalWon / playerCount

  scores.forEach((_, playerId) => {
    const won = payouts.get(playerId) || 0
    payouts.set(playerId, won - perPlayerCost)
  })

  return { results, payouts }
}
