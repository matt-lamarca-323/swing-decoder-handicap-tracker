import crypto from 'crypto'

const SALT_ROUNDS = 12

/**
 * Hash a password using bcrypt
 * Uses dynamic import to avoid bundling bcrypt in Edge Runtime (middleware)
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcrypt')
  return bcrypt.default.hash(password, SALT_ROUNDS)
}

/**
 * Verify a password against a hash
 * Uses dynamic import to avoid bundling bcrypt in Edge Runtime (middleware)
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  const bcrypt = await import('bcrypt')
  return bcrypt.default.compare(password, hashedPassword)
}

/**
 * Generate a secure random reset token
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Generate reset token expiry (1 hour from now)
 */
export function getResetTokenExpiry(): Date {
  const expiry = new Date()
  expiry.setHours(expiry.getHours() + 1)
  return expiry
}

/**
 * Check if a reset token is expired
 */
export function isResetTokenExpired(expiryDate: Date): boolean {
  return new Date() > expiryDate
}
