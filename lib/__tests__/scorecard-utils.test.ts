import { describe, it, expect } from 'vitest'
import { getScoreClass, formatStatistic, getScoreName } from '../scorecard-utils'

describe('getScoreClass', () => {
  it('should return score-eagle for eagle or better', () => {
    expect(getScoreClass(3, 5)).toBe('score-eagle') // Eagle
    expect(getScoreClass(2, 5)).toBe('score-eagle') // Albatross
    expect(getScoreClass(1, 5)).toBe('score-eagle') // Double eagle
  })

  it('should return score-birdie for birdie', () => {
    expect(getScoreClass(3, 4)).toBe('score-birdie')
    expect(getScoreClass(4, 5)).toBe('score-birdie')
    expect(getScoreClass(2, 3)).toBe('score-birdie')
  })

  it('should return score-par for par', () => {
    expect(getScoreClass(3, 3)).toBe('score-par')
    expect(getScoreClass(4, 4)).toBe('score-par')
    expect(getScoreClass(5, 5)).toBe('score-par')
  })

  it('should return score-bogey for bogey', () => {
    expect(getScoreClass(4, 3)).toBe('score-bogey')
    expect(getScoreClass(5, 4)).toBe('score-bogey')
    expect(getScoreClass(6, 5)).toBe('score-bogey')
  })

  it('should return score-double-bogey for double bogey or worse', () => {
    expect(getScoreClass(5, 3)).toBe('score-double-bogey') // Double bogey
    expect(getScoreClass(6, 3)).toBe('score-double-bogey') // Triple bogey
    expect(getScoreClass(7, 4)).toBe('score-double-bogey')
  })

  it('should return score-par for null score', () => {
    expect(getScoreClass(null, 4)).toBe('score-par')
  })

  it('should return score-par for zero score', () => {
    expect(getScoreClass(0, 4)).toBe('score-par')
  })
})

describe('formatStatistic', () => {
  it('should format statistics correctly with percentage', () => {
    expect(formatStatistic(7, 14)).toBe('7/14 (50%)')
    expect(formatStatistic(9, 18)).toBe('9/18 (50%)')
    expect(formatStatistic(5, 10)).toBe('5/10 (50%)')
  })

  it('should round percentage to nearest integer', () => {
    expect(formatStatistic(1, 3)).toBe('1/3 (33%)')
    expect(formatStatistic(2, 3)).toBe('2/3 (67%)')
    expect(formatStatistic(5, 7)).toBe('5/7 (71%)')
  })

  it('should handle perfect percentage', () => {
    expect(formatStatistic(14, 14)).toBe('14/14 (100%)')
    expect(formatStatistic(18, 18)).toBe('18/18 (100%)')
  })

  it('should handle zero numerator', () => {
    expect(formatStatistic(0, 14)).toBe('0/14 (0%)')
    expect(formatStatistic(0, 18)).toBe('0/18 (0%)')
  })

  it('should return dash for zero denominator', () => {
    expect(formatStatistic(0, 0)).toBe('-')
    expect(formatStatistic(5, 0)).toBe('-')
  })

  it('should handle various golf statistics', () => {
    // FIR example: 10 fairways hit out of 14 par 4/5 holes
    expect(formatStatistic(10, 14)).toBe('10/14 (71%)')

    // GIR example: 12 greens hit out of 18 holes
    expect(formatStatistic(12, 18)).toBe('12/18 (67%)')

    // Par Save example: 3 saves out of 6 attempts
    expect(formatStatistic(3, 6)).toBe('3/6 (50%)')
  })
})

describe('getScoreName', () => {
  it('should return correct name for albatross', () => {
    expect(getScoreName(2, 5)).toBe('Albatross')
    expect(getScoreName(1, 4)).toBe('Albatross')
  })

  it('should return correct name for eagle', () => {
    expect(getScoreName(3, 5)).toBe('Eagle')
    expect(getScoreName(2, 4)).toBe('Eagle')
    expect(getScoreName(1, 3)).toBe('Eagle')
  })

  it('should return correct name for birdie', () => {
    expect(getScoreName(2, 3)).toBe('Birdie')
    expect(getScoreName(3, 4)).toBe('Birdie')
    expect(getScoreName(4, 5)).toBe('Birdie')
  })

  it('should return correct name for par', () => {
    expect(getScoreName(3, 3)).toBe('Par')
    expect(getScoreName(4, 4)).toBe('Par')
    expect(getScoreName(5, 5)).toBe('Par')
  })

  it('should return correct name for bogey', () => {
    expect(getScoreName(4, 3)).toBe('Bogey')
    expect(getScoreName(5, 4)).toBe('Bogey')
    expect(getScoreName(6, 5)).toBe('Bogey')
  })

  it('should return correct name for double bogey', () => {
    expect(getScoreName(5, 3)).toBe('Double Bogey')
    expect(getScoreName(6, 4)).toBe('Double Bogey')
    expect(getScoreName(7, 5)).toBe('Double Bogey')
  })

  it('should return correct name for triple bogey', () => {
    expect(getScoreName(6, 3)).toBe('Triple Bogey')
    expect(getScoreName(7, 4)).toBe('Triple Bogey')
    expect(getScoreName(8, 5)).toBe('Triple Bogey')
  })

  it('should return +X format for quadruple bogey or worse', () => {
    expect(getScoreName(7, 3)).toBe('+4')
    expect(getScoreName(8, 3)).toBe('+5')
    expect(getScoreName(10, 4)).toBe('+6')
  })

  it('should return "No Score" for null or zero score', () => {
    expect(getScoreName(null, 4)).toBe('No Score')
    expect(getScoreName(0, 4)).toBe('No Score')
  })
})
