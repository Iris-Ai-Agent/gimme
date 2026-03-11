const QUEUE_KEY = 'gimme_pending_scores'

export interface PendingScore {
  roundId: string
  profileId: string
  holeNumber: number
  strokes: number
  timestamp: number
}

export function getPendingScores(): PendingScore[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
  } catch { return [] }
}

export function addPendingScore(score: PendingScore) {
  const queue = getPendingScores()
  const idx = queue.findIndex(s => s.roundId === score.roundId && s.profileId === score.profileId && s.holeNumber === score.holeNumber)
  if (idx >= 0) queue[idx] = score
  else queue.push(score)
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function removePendingScore(score: PendingScore) {
  const queue = getPendingScores().filter(s => !(s.roundId === score.roundId && s.profileId === score.profileId && s.holeNumber === score.holeNumber))
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function clearPendingScores() {
  localStorage.removeItem(QUEUE_KEY)
}
