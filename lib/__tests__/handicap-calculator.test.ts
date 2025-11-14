import { describe, it, expect } from 'vitest'
import {
  calculateHandicapDifferential,
  calculateHandicapIndex,
  calculateHandicapIndexFromRounds,
  getNumberOfDifferentialsUsed,
} from '../handicap-calculator'

describe('calculateHandicapDifferential', () => {
  it('should calculate differential correctly with valid inputs', () => {
    // Example: Score 85, Course Rating 72.0, Slope 113
    const differential = calculateHandicapDifferential(85, 72.0, 113)
    expect(differential).toBe(13.0)
  })

  it('should calculate differential for harder course (higher slope)', () => {
    // Example: Score 85, Course Rating 72.0, Slope 130
    const differential = calculateHandicapDifferential(85, 72.0, 130)
    expect(differential).toBeCloseTo(11.3, 1)
  })

  it('should calculate differential for easier course (lower slope)', () => {
    // Example: Score 85, Course Rating 72.0, Slope 100
    const differential = calculateHandicapDifferential(85, 72.0, 100)
    expect(differential).toBeCloseTo(14.7, 1)
  })

  it('should round to one decimal place', () => {
    // Example that would produce many decimals
    const differential = calculateHandicapDifferential(87, 71.5, 125)
    expect(differential).toBe(14.0)
  })

  it('should return null when course rating is null', () => {
    const differential = calculateHandicapDifferential(85, null, 113)
    expect(differential).toBeNull()
  })

  it('should return null when slope rating is null', () => {
    const differential = calculateHandicapDifferential(85, 72.0, null)
    expect(differential).toBeNull()
  })

  it('should return null when both ratings are null', () => {
    const differential = calculateHandicapDifferential(85, null, null)
    expect(differential).toBeNull()
  })

  it('should handle negative differential (score below rating)', () => {
    // Example: Score 68, Course Rating 72.0, Slope 113
    const differential = calculateHandicapDifferential(68, 72.0, 113)
    expect(differential).toBe(-4.0)
  })

  it('should handle very low score', () => {
    const differential = calculateHandicapDifferential(60, 72.0, 113)
    expect(differential).toBe(-12.0)
  })

  it('should handle very high slope rating', () => {
    // Maximum slope is typically 155
    const differential = calculateHandicapDifferential(90, 72.0, 155)
    expect(differential).toBeCloseTo(13.1, 1)
  })
})

describe('getNumberOfDifferentialsUsed', () => {
  it('should return 1 for 1-3 rounds', () => {
    expect(getNumberOfDifferentialsUsed(1)).toBe(1)
    expect(getNumberOfDifferentialsUsed(2)).toBe(1)
    expect(getNumberOfDifferentialsUsed(3)).toBe(1)
  })

  it('should return 2 for 4-8 rounds', () => {
    expect(getNumberOfDifferentialsUsed(4)).toBe(2)
    expect(getNumberOfDifferentialsUsed(5)).toBe(2)
    expect(getNumberOfDifferentialsUsed(6)).toBe(2)
    expect(getNumberOfDifferentialsUsed(7)).toBe(2)
    expect(getNumberOfDifferentialsUsed(8)).toBe(2)
  })

  it('should return 3 for 9-11 rounds', () => {
    expect(getNumberOfDifferentialsUsed(9)).toBe(3)
    expect(getNumberOfDifferentialsUsed(10)).toBe(3)
    expect(getNumberOfDifferentialsUsed(11)).toBe(3)
  })

  it('should return 4 for 12-14 rounds', () => {
    expect(getNumberOfDifferentialsUsed(12)).toBe(4)
    expect(getNumberOfDifferentialsUsed(13)).toBe(4)
    expect(getNumberOfDifferentialsUsed(14)).toBe(4)
  })

  it('should return 5 for 15-16 rounds', () => {
    expect(getNumberOfDifferentialsUsed(15)).toBe(5)
    expect(getNumberOfDifferentialsUsed(16)).toBe(5)
  })

  it('should return 6 for 17-18 rounds', () => {
    expect(getNumberOfDifferentialsUsed(17)).toBe(6)
    expect(getNumberOfDifferentialsUsed(18)).toBe(6)
  })

  it('should return 7 for 19 rounds', () => {
    expect(getNumberOfDifferentialsUsed(19)).toBe(7)
  })

  it('should return 8 for 20+ rounds', () => {
    expect(getNumberOfDifferentialsUsed(20)).toBe(8)
    expect(getNumberOfDifferentialsUsed(25)).toBe(8)
    expect(getNumberOfDifferentialsUsed(100)).toBe(8)
  })

  it('should return 8 for 0 rounds (default case)', () => {
    expect(getNumberOfDifferentialsUsed(0)).toBe(8)
  })
})

describe('calculateHandicapIndex', () => {
  it('should return null for empty array', () => {
    const index = calculateHandicapIndex([])
    expect(index).toBeNull()
  })

  it('should calculate index for 1-3 rounds (lowest - 2.0)', () => {
    // 1 round
    expect(calculateHandicapIndex([15.0])).toBe(13.0)

    // 2 rounds - uses lowest
    expect(calculateHandicapIndex([15.0, 12.0])).toBe(10.0)

    // 3 rounds - uses lowest
    expect(calculateHandicapIndex([15.0, 12.0, 18.0])).toBe(10.0)
  })

  it('should calculate index for 4-5 rounds (lowest - 1.0)', () => {
    // 4 rounds
    expect(calculateHandicapIndex([15.0, 12.0, 18.0, 14.0])).toBe(11.0)

    // 5 rounds
    expect(calculateHandicapIndex([15.0, 12.0, 18.0, 14.0, 11.0])).toBe(10.0)
  })

  it('should calculate index for 6 rounds (average of best 2 minus 1.0)', () => {
    const index = calculateHandicapIndex([15.0, 12.0, 18.0, 14.0, 11.0, 16.0])
    // Best 2: 11.0, 12.0 -> average = 11.5, minus 1.0 = 10.5
    expect(index).toBe(10.5)
  })

  it('should calculate index for 7-8 rounds (average of best 2)', () => {
    const index = calculateHandicapIndex([15.0, 12.0, 18.0, 14.0, 11.0, 16.0, 13.0])
    // Best 2: 11.0, 12.0 -> average = 11.5
    expect(index).toBe(11.5)
  })

  it('should calculate index for 9-11 rounds (average of best 3)', () => {
    const index = calculateHandicapIndex([15.0, 12.0, 18.0, 14.0, 11.0, 16.0, 13.0, 17.0, 10.0])
    // Best 3: 10.0, 11.0, 12.0 -> average = 11.0
    expect(index).toBe(11.0)
  })

  it('should calculate index for 20+ rounds (average of best 8)', () => {
    const differentials = [
      15.0, 12.0, 18.0, 14.0, 11.0, 16.0, 13.0, 17.0, 10.0, 19.0,
      14.5, 12.5, 16.5, 11.5, 13.5, 15.5, 14.0, 12.0, 18.5, 10.5
    ]
    const index = calculateHandicapIndex(differentials)
    // Best 8: 10.0, 10.5, 11.0, 11.5, 12.0, 12.0, 12.5, 13.0
    // Average = 92.5 / 8 = 11.5625 -> rounded to 11.6
    expect(index).toBeCloseTo(11.6, 1)
  })

  it('should not allow negative handicap index', () => {
    // All negative differentials (very good player)
    const index = calculateHandicapIndex([-5.0])
    expect(index).toBe(0)
  })

  it('should round to one decimal place', () => {
    // Create scenario that produces multiple decimals
    const index = calculateHandicapIndex([10.3, 11.7, 12.5, 13.1, 14.8, 15.2])
    // Best 2: 10.3, 11.7 -> average = 11.0, minus 1.0 = 10.0
    expect(index).toBe(10.0)
  })

  it('should handle identical differentials', () => {
    const index = calculateHandicapIndex([12.0, 12.0, 12.0, 12.0, 12.0, 12.0])
    // Best 2: 12.0, 12.0 -> average = 12.0, minus 1.0 = 11.0
    expect(index).toBe(11.0)
  })
})

describe('calculateHandicapIndexFromRounds', () => {
  it('should return null when no rounds provided', () => {
    const index = calculateHandicapIndexFromRounds([])
    expect(index).toBeNull()
  })

  it('should return null when rounds have no differentials', () => {
    const rounds = [
      { id: 1, score: 85, courseRating: null, slopeRating: null, handicapDifferential: null, datePlayed: new Date() }
    ]
    const index = calculateHandicapIndexFromRounds(rounds)
    expect(index).toBeNull()
  })

  it('should calculate index from rounds with valid differentials', () => {
    const rounds = [
      { id: 1, score: 85, courseRating: 72.0, slopeRating: 113, handicapDifferential: 13.0, datePlayed: new Date('2024-01-01') },
      { id: 2, score: 82, courseRating: 72.0, slopeRating: 113, handicapDifferential: 10.0, datePlayed: new Date('2024-01-02') },
      { id: 3, score: 88, courseRating: 72.0, slopeRating: 113, handicapDifferential: 16.0, datePlayed: new Date('2024-01-03') }
    ]
    const index = calculateHandicapIndexFromRounds(rounds)
    // 3 rounds: lowest (10.0) - 2.0 = 8.0
    expect(index).toBe(8.0)
  })

  it('should filter out rounds with null differentials', () => {
    const rounds = [
      { id: 1, score: 85, courseRating: 72.0, slopeRating: 113, handicapDifferential: 13.0, datePlayed: new Date('2024-01-01') },
      { id: 2, score: 82, courseRating: null, slopeRating: null, handicapDifferential: null, datePlayed: new Date('2024-01-02') },
      { id: 3, score: 88, courseRating: 72.0, slopeRating: 113, handicapDifferential: 16.0, datePlayed: new Date('2024-01-03') }
    ]
    const index = calculateHandicapIndexFromRounds(rounds)
    // 2 valid rounds: lowest (13.0) - 2.0 = 11.0
    expect(index).toBe(11.0)
  })

  it('should calculate index for 6+ rounds correctly', () => {
    const rounds = [
      { id: 1, score: 85, courseRating: 72.0, slopeRating: 113, handicapDifferential: 15.0, datePlayed: new Date('2024-01-01') },
      { id: 2, score: 82, courseRating: 72.0, slopeRating: 113, handicapDifferential: 12.0, datePlayed: new Date('2024-01-02') },
      { id: 3, score: 88, courseRating: 72.0, slopeRating: 113, handicapDifferential: 18.0, datePlayed: new Date('2024-01-03') },
      { id: 4, score: 84, courseRating: 72.0, slopeRating: 113, handicapDifferential: 14.0, datePlayed: new Date('2024-01-04') },
      { id: 5, score: 81, courseRating: 72.0, slopeRating: 113, handicapDifferential: 11.0, datePlayed: new Date('2024-01-05') },
      { id: 6, score: 86, courseRating: 72.0, slopeRating: 113, handicapDifferential: 16.0, datePlayed: new Date('2024-01-06') }
    ]
    const index = calculateHandicapIndexFromRounds(rounds)
    // 6 rounds: average of best 2 (11.0, 12.0) = 11.5, minus 1.0 = 10.5
    expect(index).toBe(10.5)
  })

  it('should handle mix of valid and null differentials', () => {
    const rounds = [
      { id: 1, score: 85, courseRating: 72.0, slopeRating: 113, handicapDifferential: 15.0, datePlayed: new Date('2024-01-01') },
      { id: 2, score: 82, courseRating: null, slopeRating: null, handicapDifferential: null, datePlayed: new Date('2024-01-02') },
      { id: 3, score: 88, courseRating: 72.0, slopeRating: 113, handicapDifferential: 18.0, datePlayed: new Date('2024-01-03') },
      { id: 4, score: 84, courseRating: null, slopeRating: 113, handicapDifferential: null, datePlayed: new Date('2024-01-04') },
      { id: 5, score: 81, courseRating: 72.0, slopeRating: 113, handicapDifferential: 11.0, datePlayed: new Date('2024-01-05') },
      { id: 6, score: 86, courseRating: 72.0, slopeRating: 113, handicapDifferential: 16.0, datePlayed: new Date('2024-01-06') }
    ]
    const index = calculateHandicapIndexFromRounds(rounds)
    // 4 valid rounds: lowest (11.0) - 1.0 = 10.0
    expect(index).toBe(10.0)
  })
})
