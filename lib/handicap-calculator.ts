/**
 * Handicap calculation utilities following USGA handicap system
 */

export interface RoundWithDifferential {
  id: number
  score: number
  courseRating: number | null
  slopeRating: number | null
  handicapDifferential: number | null
  datePlayed: Date
}

/**
 * Calculate handicap differential for a single round
 * Formula: (113 / Slope Rating) × (Score − Course Rating)
 *
 * @param score - The adjusted gross score for the round
 * @param courseRating - Course rating (e.g., 72.3)
 * @param slopeRating - Slope rating (e.g., 135)
 * @returns Handicap differential rounded to 1 decimal place, or null if ratings missing
 */
export function calculateHandicapDifferential(
  score: number,
  courseRating: number | null,
  slopeRating: number | null
): number | null {
  // Cannot calculate without both ratings
  if (!courseRating || !slopeRating) {
    return null
  }

  // USGA formula: (113 / Slope) × (Score − Rating)
  const differential = (113 / slopeRating) * (score - courseRating)

  // Round to 1 decimal place
  return Math.round(differential * 10) / 10
}

/**
 * Calculate handicap index from a set of round differentials
 * Following USGA rules for number of rounds
 *
 * @param differentials - Array of handicap differentials (sorted by lowest first is recommended)
 * @returns Handicap index rounded to 1 decimal place, or null if insufficient rounds
 */
export function calculateHandicapIndex(differentials: number[]): number | null {
  const count = differentials.length

  // Need at least 1 round
  if (count === 0) {
    return null
  }

  // Sort differentials from lowest to highest
  const sorted = [...differentials].sort((a, b) => a - b)

  let index: number

  if (count >= 1 && count <= 3) {
    // Use lowest differential minus 2.0
    index = sorted[0] - 2.0
  } else if (count >= 4 && count <= 5) {
    // Use lowest differential minus 1.0
    index = sorted[0] - 1.0
  } else if (count === 6) {
    // Average of lowest 2 differentials minus 1.0
    const avg = (sorted[0] + sorted[1]) / 2
    index = avg - 1.0
  } else if (count >= 7 && count <= 8) {
    // Average of lowest 2 differentials
    index = (sorted[0] + sorted[1]) / 2
  } else if (count >= 9 && count <= 11) {
    // Average of lowest 3 differentials
    index = (sorted[0] + sorted[1] + sorted[2]) / 3
  } else if (count >= 12 && count <= 14) {
    // Average of lowest 4 differentials
    index = (sorted[0] + sorted[1] + sorted[2] + sorted[3]) / 4
  } else if (count >= 15 && count <= 16) {
    // Average of lowest 5 differentials
    index = sorted.slice(0, 5).reduce((sum, d) => sum + d, 0) / 5
  } else if (count >= 17 && count <= 18) {
    // Average of lowest 6 differentials
    index = sorted.slice(0, 6).reduce((sum, d) => sum + d, 0) / 6
  } else if (count === 19) {
    // Average of lowest 7 differentials
    index = sorted.slice(0, 7).reduce((sum, d) => sum + d, 0) / 7
  } else {
    // 20+ rounds: Average of lowest 8 differentials
    index = sorted.slice(0, 8).reduce((sum, d) => sum + d, 0) / 8
  }

  // Handicap index cannot be negative
  if (index < 0) {
    index = 0
  }

  // Round to 1 decimal place
  return Math.round(index * 10) / 10
}

/**
 * Calculate handicap index from a set of rounds
 * Filters rounds with valid differentials and calculates index
 *
 * @param rounds - Array of rounds with differential data
 * @returns Handicap index or null if insufficient valid rounds
 */
export function calculateHandicapIndexFromRounds(
  rounds: RoundWithDifferential[]
): number | null {
  // Filter to rounds with valid differentials
  const validDifferentials = rounds
    .filter(r => r.handicapDifferential !== null)
    .map(r => r.handicapDifferential as number)

  return calculateHandicapIndex(validDifferentials)
}

/**
 * Get the number of differentials used in handicap calculation
 * Useful for displaying to users how many rounds are being used
 *
 * @param totalRounds - Total number of rounds with valid differentials
 * @returns Number of differentials used in calculation
 */
export function getNumberOfDifferentialsUsed(totalRounds: number): number {
  if (totalRounds >= 1 && totalRounds <= 3) return 1
  if (totalRounds >= 4 && totalRounds <= 8) return 2
  if (totalRounds >= 9 && totalRounds <= 11) return 3
  if (totalRounds >= 12 && totalRounds <= 14) return 4
  if (totalRounds >= 15 && totalRounds <= 16) return 5
  if (totalRounds >= 17 && totalRounds <= 18) return 6
  if (totalRounds === 19) return 7
  return 8 // 20+
}
