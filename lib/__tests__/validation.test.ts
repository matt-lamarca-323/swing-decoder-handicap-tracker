import { describe, it, expect } from 'vitest'
import { userSchema, updateUserSchema } from '../validation'

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
})
