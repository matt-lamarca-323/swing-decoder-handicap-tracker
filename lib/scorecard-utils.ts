/**
 * Scorecard utility functions for golf score display and calculations
 */

/**
 * Get CSS class for score display based on score vs par
 * @param score - The score on the hole
 * @param par - The par for the hole
 * @returns CSS class name for score display
 */
export function getScoreClass(score: number | null, par: number): string {
  if (!score || score === 0) return 'score-par'
  const diff = score - par
  if (diff <= -2) return 'score-eagle'
  if (diff === -1) return 'score-birdie'
  if (diff === 0) return 'score-par'
  if (diff === 1) return 'score-bogey'
  return 'score-double-bogey'
}

/**
 * Calculate percentage with formatting
 * @param numerator - Number of successes
 * @param denominator - Total number of attempts
 * @returns Formatted string "X/Y (Z%)" or "-" if denominator is 0
 */
export function formatStatistic(numerator: number, denominator: number): string {
  if (denominator === 0) return '-'
  const percentage = ((numerator / denominator) * 100).toFixed(0)
  return `${numerator}/${denominator} (${percentage}%)`
}

/**
 * Get score name based on score vs par
 * @param score - The score on the hole
 * @param par - The par for the hole
 * @returns Name of the score (e.g., "Birdie", "Par", "Bogey")
 */
export function getScoreName(score: number | null, par: number): string {
  if (!score || score === 0) return 'No Score'
  const diff = score - par
  if (diff <= -3) return 'Albatross'
  if (diff === -2) return 'Eagle'
  if (diff === -1) return 'Birdie'
  if (diff === 0) return 'Par'
  if (diff === 1) return 'Bogey'
  if (diff === 2) return 'Double Bogey'
  if (diff === 3) return 'Triple Bogey'
  return `+${diff}`
}
