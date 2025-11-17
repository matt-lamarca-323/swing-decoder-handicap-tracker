/**
 * Golf statistics calculation utilities
 * Calculates GIR, up & down, and putt statistics based on hole-by-hole data
 */

export interface HoleData {
  holeNumber: number
  par: number
  score: number
  putts: number
  fairwayHit?: boolean // Optional: null for par 3s
  yardage?: number // Optional: hole yardage/distance
  handicap?: number // Optional: hole handicap/difficulty rating (1-18)
}

export interface CalculatedStats {
  totalScore: number
  totalPutts: number
  greensInRegulation: number
  underGIR: number
  fairwaysInRegulation: number
  upAndDowns: number
  upAndDownAttempts: number
  girPutts: number
  nonGirPutts: number
  scrambling: number // Percentage
  parOrBetter: number
}

/**
 * Standard par values for a typical 18-hole course
 * Can be customized per course
 */
export const STANDARD_PARS: Record<number, number> = {
  1: 4, 2: 4, 3: 3, 4: 5, 5: 4, 6: 4, 7: 3, 8: 4, 9: 5,
  10: 4, 11: 3, 12: 4, 13: 5, 14: 4, 15: 4, 16: 3, 17: 4, 18: 4
}

/**
 * Determine if a green was hit in regulation based on score and putts
 * GIR definition: Reaching the green in (par - 2) or fewer strokes
 *
 * Heuristic: If player made par or better with 2+ putts, likely GIR
 * If player made birdie or better, very likely GIR
 */
export function calculateGIR(par: number, score: number, putts: number): boolean {
  const strokesBeforeGreen = score - putts
  const girTarget = par - 2

  // Definite GIR: reached green in regulation strokes or better
  if (strokesBeforeGreen <= girTarget) {
    return true
  }

  // Likely GIR: made par with 2+ putts
  if (score === par && putts >= 2) {
    return true
  }

  // Likely GIR: made birdie or better (hard to do without GIR)
  if (score < par) {
    return true
  }

  return false
}

/**
 * Determine if the green was reached under regulation (putting for eagle)
 * Under GIR definition: Reaching the green in (par - 3) or fewer strokes
 *
 * Examples:
 * - Par 5 reached in 2 strokes: Under GIR (eagle putt)
 * - Par 4 reached in 1 stroke: Under GIR (eagle putt)
 * - Par 3 reached in 0 strokes: Not applicable in normal play
 */
export function calculateUnderGIR(par: number, score: number, putts: number): boolean {
  const strokesBeforeGreen = score - putts
  const underGIRTarget = par - 3

  // Under GIR only applies to par 4s and par 5s
  if (par <= 3) {
    return false
  }

  // Reached green in par - 3 or fewer strokes (eagle opportunity)
  return strokesBeforeGreen <= underGIRTarget && strokesBeforeGreen > 0
}

/**
 * Determine if hole resulted in successful up and down
 * Up and down: Missing the green but getting up and down for par
 */
export function calculateUpAndDown(par: number, score: number, putts: number, hitGIR: boolean): {
  isAttempt: boolean
  isSuccess: boolean
} {
  // Up and down only applies when green was missed
  if (hitGIR) {
    return { isAttempt: false, isSuccess: false }
  }

  // It's an up and down attempt when green was missed
  const isAttempt = true

  // Success if made par or better from off the green
  const isSuccess = score <= par

  return { isAttempt, isSuccess }
}

/**
 * Calculate comprehensive golf statistics from hole-by-hole data
 */
export function calculateRoundStats(holes: HoleData[]): CalculatedStats {
  let totalScore = 0
  let totalPutts = 0
  let greensInRegulation = 0
  let underGIR = 0
  let fairwaysInRegulation = 0
  let upAndDowns = 0
  let upAndDownAttempts = 0
  let girPutts = 0
  let nonGirPutts = 0
  let parOrBetter = 0

  for (const hole of holes) {
    totalScore += hole.score
    totalPutts += hole.putts

    // Calculate GIR
    const hitGIR = calculateGIR(hole.par, hole.score, hole.putts)
    if (hitGIR) {
      greensInRegulation++
      girPutts += hole.putts
    } else {
      nonGirPutts += hole.putts
    }

    // Calculate Under GIR (putting for eagle)
    const hitUnderGIR = calculateUnderGIR(hole.par, hole.score, hole.putts)
    if (hitUnderGIR) {
      underGIR++
    }

    // Calculate up and down
    const { isAttempt, isSuccess } = calculateUpAndDown(
      hole.par,
      hole.score,
      hole.putts,
      hitGIR
    )
    if (isAttempt) {
      upAndDownAttempts++
      if (isSuccess) {
        upAndDowns++
      }
    }

    // Track fairways (skip par 3s)
    if (hole.par > 3 && hole.fairwayHit !== undefined && hole.fairwayHit !== null) {
      if (hole.fairwayHit) {
        fairwaysInRegulation++
      }
    }

    // Track par or better
    if (hole.score <= hole.par) {
      parOrBetter++
    }
  }

  // Calculate scrambling percentage (up and downs / attempts)
  const scrambling = upAndDownAttempts > 0
    ? (upAndDowns / upAndDownAttempts) * 100
    : 0

  return {
    totalScore,
    totalPutts,
    greensInRegulation,
    underGIR,
    fairwaysInRegulation,
    upAndDowns,
    upAndDownAttempts,
    girPutts,
    nonGirPutts,
    scrambling: Math.round(scrambling * 10) / 10,
    parOrBetter,
  }
}

/**
 * Generate default hole data for a round
 * Useful for initializing forms
 */
export function generateDefaultHoles(numHoles: number = 18, customPars?: number[]): HoleData[] {
  const holes: HoleData[] = []

  for (let i = 1; i <= numHoles; i++) {
    holes.push({
      holeNumber: i,
      par: customPars?.[i - 1] || STANDARD_PARS[i] || 4,
      score: 0,
      putts: 0,
      fairwayHit: undefined,
    })
  }

  return holes
}

/**
 * Validate hole data
 */
export function validateHoleData(holes: HoleData[]): string[] {
  const errors: string[] = []

  holes.forEach((hole) => {
    if (hole.score < 1) {
      errors.push(`Hole ${hole.holeNumber}: Score must be at least 1`)
    }
    if (hole.putts < 0) {
      errors.push(`Hole ${hole.holeNumber}: Putts cannot be negative`)
    }
    if (hole.putts > hole.score) {
      errors.push(`Hole ${hole.holeNumber}: Putts (${hole.putts}) cannot exceed score (${hole.score})`)
    }
    if (hole.par < 3 || hole.par > 6) {
      errors.push(`Hole ${hole.holeNumber}: Par must be between 3 and 6`)
    }
  })

  return errors
}

/**
 * Calculate estimated stats from total score and putts only
 * Less accurate but useful when hole-by-hole data isn't available
 */
export function estimateStatsFromTotals(
  totalScore: number,
  totalPutts: number,
  holes: number = 18,
  coursePar: number = 72
): Partial<CalculatedStats> {
  // Estimate GIR based on putts
  // Typically, GIR holes use 2 putts, non-GIR use 1-3 putts
  // Average: ~30-36 putts per round suggests ~50% GIR
  const avgPuttsPerHole = totalPutts / holes
  let estimatedGIR = 0

  if (avgPuttsPerHole < 1.7) {
    estimatedGIR = Math.round(holes * 0.3) // Low putts = likely chipping/pitching well
  } else if (avgPuttsPerHole < 2.0) {
    estimatedGIR = Math.round(holes * 0.65) // Good putting/GIR
  } else if (avgPuttsPerHole < 2.2) {
    estimatedGIR = Math.round(holes * 0.45) // Average
  } else {
    estimatedGIR = Math.round(holes * 0.25) // High putts = struggling
  }

  // Estimate up and downs (missed greens that saved par)
  const missedGreens = holes - estimatedGIR
  const strokesOverPar = totalScore - coursePar

  // If score is good relative to GIR, likely had good up and downs
  const expectedStrokesOverPar = missedGreens * 0.5 // Each missed green costs ~0.5 strokes
  const upAndDownSuccess = strokesOverPar < expectedStrokesOverPar ? 0.6 : 0.3

  const estimatedUpAndDowns = Math.round(missedGreens * upAndDownSuccess)

  return {
    greensInRegulation: estimatedGIR,
    upAndDowns: estimatedUpAndDowns,
    upAndDownAttempts: missedGreens,
    girPutts: Math.round(estimatedGIR * 2), // Assume 2 putts per GIR
    nonGirPutts: totalPutts - Math.round(estimatedGIR * 2),
  }
}
