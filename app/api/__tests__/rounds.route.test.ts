import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, POST } from '../rounds/route'
import { mockPrismaRound, mockPrismaUser, resetMocks } from './mocks/prisma'
import { createMockRequest } from './mocks/nextRequest'

// Mock console methods to avoid cluttering test output
vi.spyOn(console, 'error').mockImplementation(() => {})

describe('GET /api/rounds', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('should return all rounds', async () => {
    const mockRounds = [
      {
        id: 1,
        userId: 1,
        courseName: 'Pebble Beach',
        datePlayed: new Date('2024-01-15'),
        score: 85,
        holes: 18,
        courseRating: 72.5,
        slopeRating: 135,
        notes: 'Great round',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
        },
      },
      {
        id: 2,
        userId: 1,
        courseName: 'Augusta National',
        datePlayed: new Date('2024-01-20'),
        score: 92,
        holes: 18,
        courseRating: 74.0,
        slopeRating: 140,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
        },
      },
    ]

    mockPrismaRound.findMany.mockResolvedValue(mockRounds)

    const request = createMockRequest('GET')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(2)
    expect(data[0].courseName).toBe('Pebble Beach')
    expect(data[1].courseName).toBe('Augusta National')
    expect(mockPrismaRound.findMany).toHaveBeenCalledWith({
      where: {},
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        datePlayed: 'desc',
      },
    })
  })

  it('should filter rounds by userId', async () => {
    const mockRounds = [
      {
        id: 1,
        userId: 2,
        courseName: 'St Andrews',
        datePlayed: new Date('2024-01-15'),
        score: 88,
        holes: 18,
        courseRating: 72.0,
        slopeRating: 130,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 2,
          name: 'User 2',
          email: 'user2@example.com',
        },
      },
    ]

    mockPrismaRound.findMany.mockResolvedValue(mockRounds)

    const request = new Request('http://localhost:3000/api/rounds?userId=2')
    const response = await GET(request as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(1)
    expect(data[0].userId).toBe(2)
    expect(mockPrismaRound.findMany).toHaveBeenCalledWith({
      where: { userId: 2 },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        datePlayed: 'desc',
      },
    })
  })

  it('should return empty array when no rounds exist', async () => {
    mockPrismaRound.findMany.mockResolvedValue([])

    const request = createMockRequest('GET')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual([])
  })

  it('should handle database errors', async () => {
    mockPrismaRound.findMany.mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('GET')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to fetch rounds' })
  })
})

describe('POST /api/rounds', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('should create a new round with valid data', async () => {
    const newRound = {
      userId: 1,
      courseName: 'Pebble Beach',
      datePlayed: '2024-01-15T10:00:00Z',
      score: 85,
      holes: 18,
      courseRating: 72.5,
      slopeRating: 135,
      notes: 'Great round!',
    }

    const createdRound = {
      id: 1,
      ...newRound,
      datePlayed: new Date(newRound.datePlayed),
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
      },
    }

    mockPrismaUser.findUnique.mockResolvedValue({
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      handicapIndex: null,
      rounds: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    mockPrismaRound.create.mockResolvedValue(createdRound)

    const request = createMockRequest('POST', newRound)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.id).toBe(1)
    expect(data.courseName).toBe(newRound.courseName)
    expect(data.score).toBe(newRound.score)
    expect(data.user.id).toBe(1)
    expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
    })
  })

  it('should create round without optional fields', async () => {
    const minimalRound = {
      userId: 1,
      courseName: 'Local Course',
      datePlayed: '2024-01-15T10:00:00Z',
      score: 90,
    }

    const createdRound = {
      id: 1,
      ...minimalRound,
      datePlayed: new Date(minimalRound.datePlayed),
      holes: 18,
      courseRating: null,
      slopeRating: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
      },
    }

    mockPrismaUser.findUnique.mockResolvedValue({
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      handicapIndex: null,
      rounds: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    mockPrismaRound.create.mockResolvedValue(createdRound)

    const request = createMockRequest('POST', minimalRound)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.courseName).toBe(minimalRound.courseName)
    expect(data.score).toBe(minimalRound.score)
  })

  it('should return 404 when user does not exist', async () => {
    const newRound = {
      userId: 999,
      courseName: 'Test Course',
      datePlayed: '2024-01-15T10:00:00Z',
      score: 85,
    }

    mockPrismaUser.findUnique.mockResolvedValue(null)

    const request = createMockRequest('POST', newRound)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data).toEqual({ error: 'User not found' })
    expect(mockPrismaRound.create).not.toHaveBeenCalled()
  })

  it('should reject invalid courseName', async () => {
    const invalidRound = {
      userId: 1,
      courseName: '',
      datePlayed: '2024-01-15T10:00:00Z',
      score: 85,
    }

    const request = createMockRequest('POST', invalidRound)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation error')
    expect(mockPrismaRound.create).not.toHaveBeenCalled()
  })

  it('should reject invalid score', async () => {
    const invalidRound = {
      userId: 1,
      courseName: 'Test Course',
      datePlayed: '2024-01-15T10:00:00Z',
      score: -5,
    }

    const request = createMockRequest('POST', invalidRound)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation error')
  })

  it('should reject invalid holes value', async () => {
    const invalidRound = {
      userId: 1,
      courseName: 'Test Course',
      datePlayed: '2024-01-15T10:00:00Z',
      score: 85,
      holes: 12,
    }

    const request = createMockRequest('POST', invalidRound)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation error')
  })

  it('should handle database errors', async () => {
    const validRound = {
      userId: 1,
      courseName: 'Test Course',
      datePlayed: '2024-01-15T10:00:00Z',
      score: 85,
    }

    mockPrismaUser.findUnique.mockResolvedValue({
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      handicapIndex: null,
      rounds: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    mockPrismaRound.create.mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('POST', validRound)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to create round' })
  })
})
