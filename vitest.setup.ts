import { vi } from 'vitest'
import { mockPrisma } from './app/api/__tests__/mocks/prisma'

// Setup Prisma mock before all tests
vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))
