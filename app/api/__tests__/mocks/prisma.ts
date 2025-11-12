import { vi } from 'vitest'

export const mockPrismaUser = {
  findMany: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}

export const mockPrisma = {
  user: mockPrismaUser,
  $disconnect: vi.fn(),
}

export const resetMocks = () => {
  mockPrismaUser.findMany.mockReset()
  mockPrismaUser.findUnique.mockReset()
  mockPrismaUser.create.mockReset()
  mockPrismaUser.update.mockReset()
  mockPrismaUser.delete.mockReset()
}
