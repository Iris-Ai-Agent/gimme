import type { Score } from '@/types/database'
import { indexScoresByPlayerAndHole } from './index-scores'

export interface NassauConfig {
  frontBet: number
  backBet: number
  overallBet: number
  useHandicap: boolean
}

interface MatchState {
  scores: Map<string, number>
}

export interface NassauResult {
  front: Map<string, number>
  back: Map<string, number>
  overall: Map<string, number>
  totalPayouts: Map<string, number>
}

function matchPlayHoleWinner(
  indexed: Map<string, Map<number, Score>>,
  hole: number,
): string | null {
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

  return bestPlayers.length === 1 ? bestPlayers[0] : null
}

function resolveMatch(state: MatchState, betAmount: number): Map<string, number> {
  const payouts = new Map<string, number>()
  const players = Array.from(state.scores.keys())

  if (players.length === 2) {
    const [a, b] = players
    const diff = (state.scores.get(a) || 0) - (state.scores.get(b) || 0)
    if (diff > 0) {
      payouts.set(a, betAmount)
      payouts.set(b, -betAmount)
    } else if (diff < 0) {
      payouts.set(a, -betAmount)
      payouts.set(b, betAmount)
    } else {
      payouts.set(a, 0)
      payouts.set(b, 0)
    }
  }
  return payouts
}

export function calculateNassau(
  scores: Map<string, Score[]>,
  config: NassauConfig,
): NassauResult {
  const front: MatchState = { scores: new Map() }
  const back: MatchState = { scores: new Map() }
  const overall: MatchState = { scores: new Map() }

  const indexed = indexScoresByPlayerAndHole(scores)

  scores.forEach((_, pid) => {
    front.scores.set(pid, 0)
    back.scores.set(pid, 0)
    overall.scores.set(pid, 0)
  })

  for (let hole = 1; hole <= 18; hole++) {
    const winner = matchPlayHoleWinner(indexed, hole)
    const isBack = hole > 9
    const matchState = isBack ? back : front

    if (winner) {
      matchState.scores.set(winner, (matchState.scores.get(winner) || 0) + 1)
      overall.scores.set(winner, (overall.scores.get(winner) || 0) + 1)
    }
  }

  const totalPayouts = new Map<string, number>()
  const merge = (source: Map<string, number>) => {
    source.forEach((amount, pid) => {
      totalPayouts.set(pid, (totalPayouts.get(pid) || 0) + amount)
    })
  }

  const frontResult = resolveMatch(front, config.frontBet)
  const backResult = resolveMatch(back, config.backBet)
  const overallResult = resolveMatch(overall, config.overallBet)

  merge(frontResult)
  merge(backResult)
  merge(overallResult)

  return {
    front: frontResult,
    back: backResult,
    overall: overallResult,
    totalPayouts,
  }
}
