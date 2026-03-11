export function getScoreColor(diff: number): string {
  if (diff <= -2) return 'text-yellow-500'
  if (diff === -1) return 'text-birdie-red'
  if (diff === 0) return 'text-masters-green'
  if (diff === 1) return 'text-blue-500'
  if (diff >= 2) return 'text-gray-500'
  return ''
}

export function getScoreBg(diff: number): string {
  if (diff <= -2) return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300'
  if (diff === -1) return 'bg-red-50 dark:bg-red-900/20 border-birdie-red'
  if (diff === 0) return 'bg-green-50 dark:bg-green-900/20 border-masters-green'
  if (diff === 1) return 'bg-blue-50 dark:bg-blue-900/20 border-blue-300'
  if (diff >= 2) return 'bg-gray-100 dark:bg-gray-800 border-gray-300'
  return 'bg-white dark:bg-night-card border-rough'
}

export function getScoreLabel(diff: number): string | null {
  const labels: Record<number, string> = {
    [-3]: 'Albatross', [-2]: 'Eagle', [-1]: 'Birdie',
    [0]: 'Par', [1]: 'Bogey', [2]: 'Double', [3]: 'Triple',
  }
  return labels[diff] ?? null
}

export function getScoreDisplayClass(diff: number): string {
  if (diff <= -2) return 'bg-yellow-400 text-white rounded-full'
  if (diff === -1) return getScoreColor(diff) + ' font-bold'
  if (diff === 2) return 'text-orange-500'
  return getScoreColor(diff) || 'text-gray-500'
}
