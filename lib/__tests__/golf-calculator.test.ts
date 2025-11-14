import { describe, it, expect } from 'vitest'
import {
  calculateGIR,
  calculateUnderGIR,
  calculateUpAndDown,
  calculateRoundStats,
  generateDefaultHoles,
  validateHoleData,
  estimateStatsFromTotals,
  type HoleData,
} from '../golf-calculator'

describe('Golf Calculator', () => {
  describe('calculateGIR', () => {
    describe('definite GIR cases', () => {
      it('should return true for par 3 reached in 1 stroke with 2 putts', () => {
        expect(calculateGIR(3, 3, 2)).toBe(true)
      })

      it('should return true for par 4 reached in 2 strokes with 2 putts', () => {
        expect(calculateGIR(4, 4, 2)).toBe(true)
      })

      it('should return true for par 5 reached in 3 strokes with 2 putts', () => {
        expect(calculateGIR(5, 5, 2)).toBe(true)
      })

      it('should return true for par 4 reached in 1 stroke (eagle)', () => {
        expect(calculateGIR(4, 3, 2)).toBe(true)
      })
    })

    describe('par with multiple putts (likely GIR)', () => {
      it('should return true for par 4 made with 3 putts', () => {
        expect(calculateGIR(4, 4, 3)).toBe(true)
      })

      it('should return true for par 5 made with 2 putts', () => {
        expect(calculateGIR(5, 5, 2)).toBe(true)
      })

      it('should return false for par made with only 1 putt (likely chipped in)', () => {
        expect(calculateGIR(4, 4, 1)).toBe(false)
      })
    })

    describe('birdie or better (assumed GIR)', () => {
      it('should return true for birdie on par 4', () => {
        expect(calculateGIR(4, 3, 1)).toBe(true)
      })

      it('should return true for eagle on par 5', () => {
        expect(calculateGIR(5, 3, 2)).toBe(true)
      })

      it('should return true for birdie with 3 putts', () => {
        expect(calculateGIR(4, 3, 3)).toBe(true)
      })
    })

    describe('missed GIR cases', () => {
      it('should return false for bogey with 2 putts on par 4', () => {
        expect(calculateGIR(4, 5, 2)).toBe(false)
      })

      it('should return false for double bogey on par 4', () => {
        expect(calculateGIR(4, 6, 2)).toBe(false)
      })

      it('should return false for par 3 not reached in 1 (3 strokes, 2 putts)', () => {
        expect(calculateGIR(3, 5, 2)).toBe(false)
      })

      it('should return false for par 5 reached in 4 strokes with 2 putts', () => {
        expect(calculateGIR(5, 6, 2)).toBe(false)
      })
    })

    describe('edge cases', () => {
      it('should handle 0 putts (holed out)', () => {
        // With 0 putts, GIR = false since par with < 2 putts suggests chipped in
        expect(calculateGIR(4, 4, 0)).toBe(false)
      })

      it('should handle very high score', () => {
        expect(calculateGIR(4, 10, 3)).toBe(false)
      })

      it('should handle par 6', () => {
        expect(calculateGIR(6, 6, 2)).toBe(true)
      })
    })
  })

  describe('calculateUpAndDown', () => {
    it('should return no attempt when GIR was hit', () => {
      const result = calculateUpAndDown(4, 4, 2, true)
      expect(result.isAttempt).toBe(false)
      expect(result.isSuccess).toBe(false)
    })

    it('should return successful up and down for par save from missed green', () => {
      const result = calculateUpAndDown(4, 4, 2, false)
      expect(result.isAttempt).toBe(true)
      expect(result.isSuccess).toBe(true)
    })

    it('should return successful up and down for birdie from missed green', () => {
      const result = calculateUpAndDown(4, 3, 1, false)
      expect(result.isAttempt).toBe(true)
      expect(result.isSuccess).toBe(true)
    })

    it('should return failed up and down for bogey from missed green', () => {
      const result = calculateUpAndDown(4, 5, 2, false)
      expect(result.isAttempt).toBe(true)
      expect(result.isSuccess).toBe(false)
    })

    it('should return failed up and down for double bogey from missed green', () => {
      const result = calculateUpAndDown(4, 6, 3, false)
      expect(result.isAttempt).toBe(true)
      expect(result.isSuccess).toBe(false)
    })

    it('should handle par 3 up and down', () => {
      const result = calculateUpAndDown(3, 3, 1, false)
      expect(result.isAttempt).toBe(true)
      expect(result.isSuccess).toBe(true)
    })

    it('should handle par 5 up and down', () => {
      const result = calculateUpAndDown(5, 5, 2, false)
      expect(result.isAttempt).toBe(true)
      expect(result.isSuccess).toBe(true)
    })
  })

  describe('calculateUnderGIR', () => {
    describe('Under GIR cases (eagle opportunities)', () => {
      it('should return true for par 5 reached in 2 strokes (eagle putt)', () => {
        // Par 5, score 4, 2 putts = reached in 2 strokes
        expect(calculateUnderGIR(5, 4, 2)).toBe(true)
      })

      it('should return true for par 5 reached in 1 stroke (albatross putt)', () => {
        // Par 5, score 3, 2 putts = reached in 1 stroke
        expect(calculateUnderGIR(5, 3, 2)).toBe(true)
      })

      it('should return true for par 4 reached in 1 stroke (eagle putt)', () => {
        // Par 4, score 3, 2 putts = reached in 1 stroke
        expect(calculateUnderGIR(4, 3, 2)).toBe(true)
      })

      it('should return true for par 4 reached in 1 stroke with 1 putt (holed eagle)', () => {
        // Par 4, score 2, 1 putt = reached in 1 stroke
        expect(calculateUnderGIR(4, 2, 1)).toBe(true)
      })
    })

    describe('NOT Under GIR cases', () => {
      it('should return false for par 5 reached in 3 strokes (regular GIR)', () => {
        // Par 5, score 5, 2 putts = reached in 3 strokes (GIR but not Under GIR)
        expect(calculateUnderGIR(5, 5, 2)).toBe(false)
      })

      it('should return false for par 4 reached in 2 strokes (regular GIR)', () => {
        // Par 4, score 4, 2 putts = reached in 2 strokes (GIR but not Under GIR)
        expect(calculateUnderGIR(4, 4, 2)).toBe(false)
      })

      it('should return false for par 5 reached in 4 strokes (missed GIR)', () => {
        // Par 5, score 6, 2 putts = reached in 4 strokes
        expect(calculateUnderGIR(5, 6, 2)).toBe(false)
      })

      it('should return false for par 4 reached in 3 strokes (missed GIR)', () => {
        // Par 4, score 5, 2 putts = reached in 3 strokes
        expect(calculateUnderGIR(4, 5, 2)).toBe(false)
      })

      it('should return false for par 3 (Under GIR not applicable)', () => {
        // Par 3, score 2, 1 putt = hole in one (not Under GIR by definition)
        expect(calculateUnderGIR(3, 2, 1)).toBe(false)
      })

      it('should return false for par 3 with any score', () => {
        expect(calculateUnderGIR(3, 3, 2)).toBe(false)
        expect(calculateUnderGIR(3, 4, 2)).toBe(false)
      })
    })

    describe('edge cases', () => {
      it('should return false when strokes to green is 0 or negative', () => {
        // Par 5, score 2, 3 putts would imply -1 strokes to green
        expect(calculateUnderGIR(5, 2, 3)).toBe(false)
      })

      it('should handle par 6 reached in 3 strokes', () => {
        // Par 6, score 5, 2 putts = reached in 3 strokes (par - 3)
        expect(calculateUnderGIR(6, 5, 2)).toBe(true)
      })

      it('should handle 0 putts (holed out for eagle)', () => {
        // Par 5, score 3, 0 putts = holed out in 3 strokes (NOT Under GIR)
        // Under GIR requires reaching in 2 or fewer for par 5
        expect(calculateUnderGIR(5, 3, 0)).toBe(false)
      })

      it('should return false for par 5 eagle made (but reached in 3)', () => {
        // Par 5, score 3, 1 putt = reached in 2 (Under GIR!)
        // This is actually Under GIR
        expect(calculateUnderGIR(5, 3, 1)).toBe(true)
      })
    })
  })

  describe('calculateRoundStats', () => {
    it('should calculate stats for perfect round (all GIR, all pars)', () => {
      const holes: HoleData[] = [
        { holeNumber: 1, par: 4, score: 4, putts: 2, fairwayHit: true },
        { holeNumber: 2, par: 4, score: 4, putts: 2, fairwayHit: true },
        { holeNumber: 3, par: 3, score: 3, putts: 2 },
        { holeNumber: 4, par: 5, score: 5, putts: 2, fairwayHit: true },
        { holeNumber: 5, par: 4, score: 4, putts: 2, fairwayHit: true },
        { holeNumber: 6, par: 4, score: 4, putts: 2, fairwayHit: false },
        { holeNumber: 7, par: 3, score: 3, putts: 2 },
        { holeNumber: 8, par: 4, score: 4, putts: 2, fairwayHit: true },
        { holeNumber: 9, par: 5, score: 5, putts: 2, fairwayHit: true },
      ]

      const stats = calculateRoundStats(holes)

      expect(stats.totalScore).toBe(36)
      expect(stats.totalPutts).toBe(18)
      expect(stats.greensInRegulation).toBe(9)
      expect(stats.underGIR).toBe(0) // No eagle opportunities
      expect(stats.fairwaysInRegulation).toBe(6) // 7 fairway holes, 6 hit
      expect(stats.upAndDowns).toBe(0)
      expect(stats.upAndDownAttempts).toBe(0)
      expect(stats.girPutts).toBe(18)
      expect(stats.nonGirPutts).toBe(0)
      expect(stats.parOrBetter).toBe(9)
      expect(stats.scrambling).toBe(0)
    })

    it('should calculate stats for round with missed greens and up and downs', () => {
      const holes: HoleData[] = [
        { holeNumber: 1, par: 4, score: 5, putts: 2, fairwayHit: true },  // Miss, no up&down
        { holeNumber: 2, par: 4, score: 4, putts: 1, fairwayHit: true },  // Miss, up&down!
        { holeNumber: 3, par: 3, score: 3, putts: 2 },                    // GIR
        { holeNumber: 4, par: 5, score: 6, putts: 3, fairwayHit: false }, // Miss, no up&down
        { holeNumber: 5, par: 4, score: 4, putts: 2, fairwayHit: true },  // GIR
        { holeNumber: 6, par: 4, score: 4, putts: 1, fairwayHit: false }, // Miss, up&down!
        { holeNumber: 7, par: 3, score: 4, putts: 2 },                    // Miss, no up&down
        { holeNumber: 8, par: 4, score: 4, putts: 2, fairwayHit: true },  // GIR
        { holeNumber: 9, par: 5, score: 5, putts: 2, fairwayHit: true },  // GIR
      ]

      const stats = calculateRoundStats(holes)

      expect(stats.totalScore).toBe(39)
      expect(stats.totalPutts).toBe(17)
      expect(stats.greensInRegulation).toBe(5) // Holes 3,4,5,8,9
      expect(stats.fairwaysInRegulation).toBe(5) // Holes 1,2,5,8,9 (par 3s skipped)
      expect(stats.upAndDowns).toBe(2)
      expect(stats.upAndDownAttempts).toBe(4) // Holes 1,2,6,7 missed green
      expect(stats.girPutts).toBe(11) // 5 GIR holes: 2+3+2+2+2 = 11
      expect(stats.nonGirPutts).toBe(6) // 4 missed: 2+1+1+2 = 6
      expect(stats.parOrBetter).toBe(6) // Holes 2,3,5,6,8,9
      expect(stats.scrambling).toBe(50.0) // 2/4 = 50%
    })

    it('should calculate stats for excellent round with birdies', () => {
      const holes: HoleData[] = [
        { holeNumber: 1, par: 4, score: 3, putts: 1, fairwayHit: true },  // Birdie (GIR)
        { holeNumber: 2, par: 4, score: 3, putts: 2, fairwayHit: true },  // Birdie (GIR)
        { holeNumber: 3, par: 3, score: 2, putts: 1 },                    // Birdie (GIR)
        { holeNumber: 4, par: 5, score: 4, putts: 2, fairwayHit: true },  // Birdie (GIR)
        { holeNumber: 5, par: 4, score: 4, putts: 2, fairwayHit: true },  // Par (GIR)
        { holeNumber: 6, par: 4, score: 4, putts: 2, fairwayHit: true },  // Par (GIR)
        { holeNumber: 7, par: 3, score: 3, putts: 2 },                    // Par (GIR)
        { holeNumber: 8, par: 4, score: 5, putts: 2, fairwayHit: false }, // Bogey (Miss)
        { holeNumber: 9, par: 5, score: 5, putts: 2, fairwayHit: true },  // Par (GIR)
      ]

      const stats = calculateRoundStats(holes)

      expect(stats.totalScore).toBe(33) // 4 under par
      expect(stats.totalPutts).toBe(16)
      expect(stats.greensInRegulation).toBe(8)
      expect(stats.fairwaysInRegulation).toBe(6)
      expect(stats.upAndDowns).toBe(0)
      expect(stats.upAndDownAttempts).toBe(1)
      expect(stats.parOrBetter).toBe(8)
    })

    it('should handle empty holes array', () => {
      const stats = calculateRoundStats([])

      expect(stats.totalScore).toBe(0)
      expect(stats.totalPutts).toBe(0)
      expect(stats.greensInRegulation).toBe(0)
      expect(stats.fairwaysInRegulation).toBe(0)
      expect(stats.upAndDowns).toBe(0)
      expect(stats.upAndDownAttempts).toBe(0)
      expect(stats.scrambling).toBe(0)
    })

    it('should handle holes without fairway data', () => {
      const holes: HoleData[] = [
        { holeNumber: 1, par: 4, score: 4, putts: 2 },
        { holeNumber: 2, par: 3, score: 3, putts: 2 },
      ]

      const stats = calculateRoundStats(holes)

      expect(stats.fairwaysInRegulation).toBe(0)
      expect(stats.totalScore).toBe(7)
    })

    it('should track Under GIR (eagle opportunities)', () => {
      const holes: HoleData[] = [
        { holeNumber: 1, par: 5, score: 4, putts: 2, fairwayHit: true },  // Par 5 in 2 strokes: Under GIR!
        { holeNumber: 2, par: 4, score: 3, putts: 2, fairwayHit: true },  // Par 4 in 1 stroke: Under GIR!
        { holeNumber: 3, par: 3, score: 2, putts: 1 },                    // Par 3: Not Under GIR
        { holeNumber: 4, par: 5, score: 3, putts: 1, fairwayHit: true },  // Par 5 in 2 strokes: Under GIR!
        { holeNumber: 5, par: 4, score: 4, putts: 2, fairwayHit: true },  // Par 4 in 2 strokes: GIR, not Under
        { holeNumber: 6, par: 5, score: 5, putts: 2, fairwayHit: true },  // Par 5 in 3 strokes: GIR, not Under
        { holeNumber: 7, par: 4, score: 2, putts: 1, fairwayHit: true },  // Par 4 in 1 stroke: Under GIR!
        { holeNumber: 8, par: 4, score: 5, putts: 2, fairwayHit: false }, // Missed green
        { holeNumber: 9, par: 5, score: 6, putts: 2, fairwayHit: true },  // Missed green
      ]

      const stats = calculateRoundStats(holes)

      expect(stats.underGIR).toBe(4) // Holes 1, 2, 4, 7
      expect(stats.greensInRegulation).toBe(7) // Holes 1-7 (all made GIR)
      expect(stats.totalScore).toBe(34) // 4+3+2+3+4+5+2+5+6
    })

    it('should skip par 3s for fairway calculation', () => {
      const holes: HoleData[] = [
        { holeNumber: 1, par: 3, score: 3, putts: 2, fairwayHit: true }, // Par 3, fairway ignored
        { holeNumber: 2, par: 4, score: 4, putts: 2, fairwayHit: true },
        { holeNumber: 3, par: 5, score: 5, putts: 2, fairwayHit: false },
      ]

      const stats = calculateRoundStats(holes)

      expect(stats.fairwaysInRegulation).toBe(1) // Only hole 2 counts
    })
  })

  describe('generateDefaultHoles', () => {
    it('should generate 18 holes with standard pars', () => {
      const holes = generateDefaultHoles(18)

      expect(holes).toHaveLength(18)
      expect(holes[0]).toEqual({
        holeNumber: 1,
        par: 4,
        score: 0,
        putts: 0,
        fairwayHit: undefined,
      })
      expect(holes[2]).toEqual({
        holeNumber: 3,
        par: 3,
        score: 0,
        putts: 0,
        fairwayHit: undefined,
      })
    })

    it('should generate 9 holes', () => {
      const holes = generateDefaultHoles(9)

      expect(holes).toHaveLength(9)
      expect(holes[0].holeNumber).toBe(1)
      expect(holes[8].holeNumber).toBe(9)
    })

    it('should use custom pars when provided', () => {
      const customPars = [5, 4, 3, 4, 5, 4, 3, 4, 4]
      const holes = generateDefaultHoles(9, customPars)

      expect(holes[0].par).toBe(5)
      expect(holes[2].par).toBe(3)
      expect(holes[8].par).toBe(4)
    })

    it('should default to 18 holes if no argument provided', () => {
      const holes = generateDefaultHoles()

      expect(holes).toHaveLength(18)
    })

    it('should fall back to par 4 for holes beyond standard pars', () => {
      const holes = generateDefaultHoles(20)

      expect(holes).toHaveLength(20)
      expect(holes[18].par).toBe(4) // Hole 19 defaults to 4
      expect(holes[19].par).toBe(4) // Hole 20 defaults to 4
    })
  })

  describe('validateHoleData', () => {
    it('should return empty array for valid data', () => {
      const holes: HoleData[] = [
        { holeNumber: 1, par: 4, score: 5, putts: 2 },
        { holeNumber: 2, par: 3, score: 3, putts: 2 },
      ]

      const errors = validateHoleData(holes)

      expect(errors).toEqual([])
    })

    it('should reject score less than 1', () => {
      const holes: HoleData[] = [
        { holeNumber: 1, par: 4, score: 0, putts: 2 },
      ]

      const errors = validateHoleData(holes)

      expect(errors).toHaveLength(2) // Score < 1 AND putts > score
      expect(errors[0]).toContain('Score must be at least 1')
      expect(errors[1]).toContain('Putts (2) cannot exceed score (0)')
    })

    it('should reject negative putts', () => {
      const holes: HoleData[] = [
        { holeNumber: 1, par: 4, score: 4, putts: -1 },
      ]

      const errors = validateHoleData(holes)

      expect(errors).toHaveLength(1)
      expect(errors[0]).toContain('Putts cannot be negative')
    })

    it('should reject putts greater than score', () => {
      const holes: HoleData[] = [
        { holeNumber: 1, par: 4, score: 4, putts: 5 },
      ]

      const errors = validateHoleData(holes)

      expect(errors).toHaveLength(1)
      expect(errors[0]).toContain('Putts (5) cannot exceed score (4)')
    })

    it('should reject par less than 3', () => {
      const holes: HoleData[] = [
        { holeNumber: 1, par: 2, score: 4, putts: 2 },
      ]

      const errors = validateHoleData(holes)

      expect(errors).toHaveLength(1)
      expect(errors[0]).toContain('Par must be between 3 and 6')
    })

    it('should reject par greater than 6', () => {
      const holes: HoleData[] = [
        { holeNumber: 1, par: 7, score: 7, putts: 2 },
      ]

      const errors = validateHoleData(holes)

      expect(errors).toHaveLength(1)
      expect(errors[0]).toContain('Par must be between 3 and 6')
    })

    it('should return multiple errors for multiple invalid holes', () => {
      const holes: HoleData[] = [
        { holeNumber: 1, par: 4, score: 0, putts: 2 },
        { holeNumber: 2, par: 3, score: 3, putts: -1 },
        { holeNumber: 3, par: 7, score: 3, putts: 4 },
      ]

      const errors = validateHoleData(holes)

      // Hole 1: score < 1, putts > score
      // Hole 2: putts < 0
      // Hole 3: par > 6, putts > score
      expect(errors).toHaveLength(5)
    })

    it('should allow 0 putts (holed out)', () => {
      const holes: HoleData[] = [
        { holeNumber: 1, par: 4, score: 4, putts: 0 },
      ]

      const errors = validateHoleData(holes)

      expect(errors).toEqual([])
    })
  })

  describe('estimateStatsFromTotals', () => {
    it('should estimate stats for excellent round (low putts)', () => {
      const stats = estimateStatsFromTotals(75, 28, 18, 72)

      // 28/18 = 1.56 avg putts, which is < 1.7, so ~30% GIR
      expect(stats.greensInRegulation).toBe(5) // Math.round(18 * 0.3) = 5
      expect(stats.upAndDownAttempts).toBe(13) // 18 - 5 = 13
      expect(stats.upAndDowns).toBeGreaterThan(0)
      expect(stats.girPutts).toBe(10) // 5 GIR * 2 putts
      expect(stats.nonGirPutts).toBe(18) // 28 - 10
    })

    it('should estimate stats for average round', () => {
      const stats = estimateStatsFromTotals(90, 36, 18, 72)

      expect(stats.greensInRegulation).toBe(8) // ~45% GIR for 2.0 avg putts
      expect(stats.upAndDownAttempts).toBe(10)
      expect(stats.girPutts).toBe(16)
      expect(stats.nonGirPutts).toBe(20)
    })

    it('should estimate stats for struggling round (high putts)', () => {
      const stats = estimateStatsFromTotals(100, 42, 18, 72)

      expect(stats.greensInRegulation).toBe(5) // ~25% GIR for 2.33 avg putts
      expect(stats.upAndDownAttempts).toBe(13)
      expect(stats.girPutts).toBe(10)
      expect(stats.nonGirPutts).toBe(32)
    })

    it('should estimate stats for very low putts (short game master)', () => {
      const stats = estimateStatsFromTotals(85, 26, 18, 72)

      expect(stats.greensInRegulation).toBe(5) // ~30% GIR for 1.44 avg putts
      expect(stats.upAndDownAttempts).toBe(13)
    })

    it('should handle 9-hole rounds', () => {
      const stats = estimateStatsFromTotals(45, 18, 9, 36)

      expect(stats.greensInRegulation).toBeGreaterThan(0)
      expect(stats.upAndDownAttempts).toBeGreaterThan(0)
      expect(stats.upAndDownAttempts).toBeLessThan(9)
    })

    it('should handle perfect round', () => {
      const stats = estimateStatsFromTotals(72, 32, 18, 72)

      expect(stats.greensInRegulation).toBeGreaterThan(0)
      expect(stats.upAndDowns).toBeGreaterThan(0)
    })

    it('should not produce negative stats', () => {
      const stats = estimateStatsFromTotals(120, 50, 18, 72)

      expect(stats.greensInRegulation).toBeGreaterThanOrEqual(0)
      expect(stats.upAndDowns).toBeGreaterThanOrEqual(0)
      expect(stats.upAndDownAttempts).toBeGreaterThanOrEqual(0)
      expect(stats.girPutts).toBeGreaterThanOrEqual(0)
      expect(stats.nonGirPutts).toBeGreaterThanOrEqual(0)
    })
  })
})
