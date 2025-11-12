import { describe, it, expect } from 'vitest'
import { userSchema, updateUserSchema, roundSchema, updateRoundSchema } from '../validation'

describe('Validation Schemas', () => {
  describe('userSchema', () => {
    it('should validate a valid user object', () => {
      const validUser = {
        email: 'test@example.com',
        name: 'Test User',
        handicapIndex: 12.5,
        rounds: 10,
      }

      const result = userSchema.safeParse(validUser)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validUser)
      }
    })

    it('should validate user without optional fields', () => {
      const minimalUser = {
        email: 'test@example.com',
        name: 'Test User',
      }

      const result = userSchema.safeParse(minimalUser)
      expect(result.success).toBe(true)
    })

    it('should accept null handicapIndex', () => {
      const userWithNullHandicap = {
        email: 'test@example.com',
        name: 'Test User',
        handicapIndex: null,
      }

      const result = userSchema.safeParse(userWithNullHandicap)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidUser = {
        email: 'not-an-email',
        name: 'Test User',
      }

      const result = userSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Invalid email address')
      }
    })

    it('should reject empty name', () => {
      const invalidUser = {
        email: 'test@example.com',
        name: '',
      }

      const result = userSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Name is required')
      }
    })

    it('should reject missing email', () => {
      const invalidUser = {
        name: 'Test User',
      }

      const result = userSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    it('should reject missing name', () => {
      const invalidUser = {
        email: 'test@example.com',
      }

      const result = userSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    it('should reject negative rounds', () => {
      const invalidUser = {
        email: 'test@example.com',
        name: 'Test User',
        rounds: -5,
      }

      const result = userSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    it('should reject non-integer rounds', () => {
      const invalidUser = {
        email: 'test@example.com',
        name: 'Test User',
        rounds: 5.5,
      }

      const result = userSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })
  })

  describe('updateUserSchema', () => {
    it('should validate a complete update', () => {
      const update = {
        email: 'new@example.com',
        name: 'New Name',
        handicapIndex: 15.0,
        rounds: 20,
      }

      const result = updateUserSchema.safeParse(update)
      expect(result.success).toBe(true)
    })

    it('should validate partial update with only email', () => {
      const update = {
        email: 'new@example.com',
      }

      const result = updateUserSchema.safeParse(update)
      expect(result.success).toBe(true)
    })

    it('should validate partial update with only name', () => {
      const update = {
        name: 'New Name',
      }

      const result = updateUserSchema.safeParse(update)
      expect(result.success).toBe(true)
    })

    it('should validate partial update with only handicapIndex', () => {
      const update = {
        handicapIndex: 8.5,
      }

      const result = updateUserSchema.safeParse(update)
      expect(result.success).toBe(true)
    })

    it('should validate empty update object', () => {
      const update = {}

      const result = updateUserSchema.safeParse(update)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email in update', () => {
      const update = {
        email: 'invalid-email',
      }

      const result = updateUserSchema.safeParse(update)
      expect(result.success).toBe(false)
    })

    it('should reject empty name in update', () => {
      const update = {
        name: '',
      }

      const result = updateUserSchema.safeParse(update)
      expect(result.success).toBe(false)
    })

    it('should reject negative rounds in update', () => {
      const update = {
        rounds: -10,
      }

      const result = updateUserSchema.safeParse(update)
      expect(result.success).toBe(false)
    })
  })

  describe('roundSchema', () => {
    it('should validate a valid round object', () => {
      const validRound = {
        userId: 1,
        courseName: 'Pebble Beach',
        datePlayed: '2024-01-15T10:00:00Z',
        score: 85,
        holes: 18,
        courseRating: 72.5,
        slopeRating: 135,
        notes: 'Great round!',
      }

      const result = roundSchema.safeParse(validRound)
      expect(result.success).toBe(true)
    })

    it('should validate round without optional fields', () => {
      const minimalRound = {
        userId: 1,
        courseName: 'Augusta National',
        datePlayed: '2024-01-15T10:00:00Z',
        score: 90,
      }

      const result = roundSchema.safeParse(minimalRound)
      expect(result.success).toBe(true)
    })

    it('should accept Date object for datePlayed', () => {
      const roundWithDate = {
        userId: 1,
        courseName: 'St Andrews',
        datePlayed: new Date('2024-01-15'),
        score: 88,
      }

      const result = roundSchema.safeParse(roundWithDate)
      expect(result.success).toBe(true)
    })

    it('should accept 9 holes', () => {
      const nineHoleRound = {
        userId: 1,
        courseName: 'Local Course',
        datePlayed: '2024-01-15T10:00:00Z',
        score: 45,
        holes: 9,
      }

      const result = roundSchema.safeParse(nineHoleRound)
      expect(result.success).toBe(true)
    })

    it('should reject invalid userId (not positive)', () => {
      const invalidRound = {
        userId: 0,
        courseName: 'Test Course',
        datePlayed: '2024-01-15T10:00:00Z',
        score: 85,
      }

      const result = roundSchema.safeParse(invalidRound)
      expect(result.success).toBe(false)
    })

    it('should reject missing courseName', () => {
      const invalidRound = {
        userId: 1,
        datePlayed: '2024-01-15T10:00:00Z',
        score: 85,
      }

      const result = roundSchema.safeParse(invalidRound)
      expect(result.success).toBe(false)
    })

    it('should reject empty courseName', () => {
      const invalidRound = {
        userId: 1,
        courseName: '',
        datePlayed: '2024-01-15T10:00:00Z',
        score: 85,
      }

      const result = roundSchema.safeParse(invalidRound)
      expect(result.success).toBe(false)
    })

    it('should reject invalid datePlayed format', () => {
      const invalidRound = {
        userId: 1,
        courseName: 'Test Course',
        datePlayed: 'not-a-date',
        score: 85,
      }

      const result = roundSchema.safeParse(invalidRound)
      expect(result.success).toBe(false)
    })

    it('should reject non-positive score', () => {
      const invalidRound = {
        userId: 1,
        courseName: 'Test Course',
        datePlayed: '2024-01-15T10:00:00Z',
        score: 0,
      }

      const result = roundSchema.safeParse(invalidRound)
      expect(result.success).toBe(false)
    })

    it('should reject invalid holes value (not 9 or 18)', () => {
      const invalidRound = {
        userId: 1,
        courseName: 'Test Course',
        datePlayed: '2024-01-15T10:00:00Z',
        score: 85,
        holes: 12,
      }

      const result = roundSchema.safeParse(invalidRound)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Holes must be either 9 or 18')
      }
    })

    it('should accept null courseRating and slopeRating', () => {
      const roundWithNullRatings = {
        userId: 1,
        courseName: 'Test Course',
        datePlayed: '2024-01-15T10:00:00Z',
        score: 85,
        courseRating: null,
        slopeRating: null,
      }

      const result = roundSchema.safeParse(roundWithNullRatings)
      expect(result.success).toBe(true)
    })
  })

  describe('updateRoundSchema', () => {
    it('should validate a complete update', () => {
      const update = {
        courseName: 'New Course',
        score: 78,
        notes: 'Updated notes',
      }

      const result = updateRoundSchema.safeParse(update)
      expect(result.success).toBe(true)
    })

    it('should validate partial update with only score', () => {
      const update = {
        score: 92,
      }

      const result = updateRoundSchema.safeParse(update)
      expect(result.success).toBe(true)
    })

    it('should validate partial update with only courseName', () => {
      const update = {
        courseName: 'Updated Course Name',
      }

      const result = updateRoundSchema.safeParse(update)
      expect(result.success).toBe(true)
    })

    it('should validate empty update object', () => {
      const update = {}

      const result = updateRoundSchema.safeParse(update)
      expect(result.success).toBe(true)
    })

    it('should reject invalid score in update', () => {
      const update = {
        score: -5,
      }

      const result = updateRoundSchema.safeParse(update)
      expect(result.success).toBe(false)
    })

    it('should reject empty courseName in update', () => {
      const update = {
        courseName: '',
      }

      const result = updateRoundSchema.safeParse(update)
      expect(result.success).toBe(false)
    })

    it('should reject invalid holes in update', () => {
      const update = {
        holes: 27,
      }

      const result = updateRoundSchema.safeParse(update)
      expect(result.success).toBe(false)
    })
  })
})
