import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, POST } from '../users/route'
import { mockPrismaUser, resetMocks } from './mocks/prisma'
import { createMockRequest } from './mocks/nextRequest'

// Mock console methods to avoid cluttering test output
vi.spyOn(console, 'error').mockImplementation(() => {})

describe('GET /api/users', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('should return all users', async () => {
    const mockUsers = [
      {
        id: 1,
        email: 'user1@example.com',
        name: 'User 1',
        handicapIndex: 12.5,
        rounds: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        email: 'user2@example.com',
        name: 'User 2',
        handicapIndex: 8.3,
        rounds: 25,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    mockPrismaUser.findMany.mockResolvedValue(mockUsers)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(2)
    expect(data[0].email).toBe('user1@example.com')
    expect(data[1].email).toBe('user2@example.com')
    expect(data[0].handicapIndex).toBe(12.5)
    expect(mockPrismaUser.findMany).toHaveBeenCalledWith({
      orderBy: {
        createdAt: 'desc',
      },
    })
  })

  it('should return empty array when no users exist', async () => {
    mockPrismaUser.findMany.mockResolvedValue([])

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual([])
  })

  it('should handle database errors', async () => {
    mockPrismaUser.findMany.mockRejectedValue(new Error('Database error'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to fetch users' })
  })
})

describe('POST /api/users', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('should create a new user with valid data', async () => {
    const newUser = {
      email: 'newuser@example.com',
      name: 'New User',
      handicapIndex: 15.0,
      rounds: 5,
    }

    const createdUser = {
      id: 1,
      ...newUser,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockPrismaUser.create.mockResolvedValue(createdUser)

    const request = createMockRequest('POST', newUser)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.id).toBe(1)
    expect(data.email).toBe(newUser.email)
    expect(data.name).toBe(newUser.name)
    expect(data.handicapIndex).toBe(newUser.handicapIndex)
    expect(data.rounds).toBe(newUser.rounds)
    expect(data.createdAt).toBeDefined()
    expect(data.updatedAt).toBeDefined()
    expect(mockPrismaUser.create).toHaveBeenCalledWith({
      data: newUser,
    })
  })

  it('should create user without optional fields', async () => {
    const minimalUser = {
      email: 'minimal@example.com',
      name: 'Minimal User',
    }

    const createdUser = {
      id: 1,
      ...minimalUser,
      handicapIndex: null,
      rounds: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockPrismaUser.create.mockResolvedValue(createdUser)

    const request = createMockRequest('POST', minimalUser)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.email).toBe(minimalUser.email)
    expect(data.name).toBe(minimalUser.name)
  })

  it('should reject invalid email', async () => {
    const invalidUser = {
      email: 'not-an-email',
      name: 'Test User',
    }

    const request = createMockRequest('POST', invalidUser)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation error')
    expect(data.details).toBeDefined()
    expect(mockPrismaUser.create).not.toHaveBeenCalled()
  })

  it('should reject missing email', async () => {
    const invalidUser = {
      name: 'Test User',
    }

    const request = createMockRequest('POST', invalidUser)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation error')
    expect(mockPrismaUser.create).not.toHaveBeenCalled()
  })

  it('should reject missing name', async () => {
    const invalidUser = {
      email: 'test@example.com',
    }

    const request = createMockRequest('POST', invalidUser)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation error')
    expect(mockPrismaUser.create).not.toHaveBeenCalled()
  })

  it('should reject empty name', async () => {
    const invalidUser = {
      email: 'test@example.com',
      name: '',
    }

    const request = createMockRequest('POST', invalidUser)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation error')
  })

  it('should handle database errors', async () => {
    const validUser = {
      email: 'test@example.com',
      name: 'Test User',
    }

    mockPrismaUser.create.mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('POST', validUser)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to create user' })
  })
})
