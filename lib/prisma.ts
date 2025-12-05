import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Explicitly pass DATABASE_URL for serverless environments (AWS Amplify, Vercel, etc.)
// Configure for PgBouncer/connection pooling compatibility
// Use AMPLIFY_DATABASE_URL as fallback since Amplify may override DATABASE_URL
const databaseUrl = process.env.AMPLIFY_DATABASE_URL || process.env.DATABASE_URL

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  },
  // Disable Prisma's connection pool when using external pooler (PgBouncer)
  // This prevents "prepared statement already exists" errors
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
