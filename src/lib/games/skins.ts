import type { Score } from '@/types/database'

export interface SkinsConfig {
  skinValue: number
  carryover: boolean
  useNet: boolean
}

export interface SkinResult {
  hole: number
  winner: string | null
  value: number
  carryover: boolean
}

export function calculateSkins(
  scores: Map<string, Score[]>,
  config: SkinsConfig,
  totalHoles: number,
): { results: SkinResult[]; payouts: Map<string, number> } {
  const results: SkinResult[] = []
  const payouts = new Map<string, number>()
  let pot = config.skinValue

  for (let hole = 1; hole <= totalHoles; hole++) {
    let bestScore = Infinity
    let bestPlayers: string[] = []

    scores.forEach((playerScores, playerId) => {
      const holeScore = playerScores.find((s) => s.hole_number === hole)
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
      results.push({ hole, winner, value: pot, carryover: false })
      payouts.set(winner, (payouts.get(winner) || 0) + pot)
      pot = config.skinValue
    } else {
      results.push({ hole, winner: null, value: pot, carryover: true })
      if (config.carryover) {
        pot += config.skinValue
      } else {
        pot = config.skinValue
      }
    }
  }

  const totalWon = Array.from(payouts.values()).reduce((a, b) => a + b, 0)
  const playerCount = scores.size
  const perPlayerCost = totalWon / playerCount

  scores.forEach((_, playerId) => {
    const won = payouts.get(playerId) || 0
    payouts.set(playerId, won - perPlayerCost)
  })

  return { results, payouts }
}
