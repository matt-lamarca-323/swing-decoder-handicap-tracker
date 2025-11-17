import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Explicitly pass DATABASE_URL for serverless environments (AWS Amplify, Vercel, etc.)
// Configure for PgBouncer/connection pooling compatibility
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Disable Prisma's connection pool when using external pooler (PgBouncer)
  // This prevents "prepared statement already exists" errors
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
