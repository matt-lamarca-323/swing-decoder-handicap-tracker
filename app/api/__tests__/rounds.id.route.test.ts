import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, PUT, DELETE } from '../rounds/[id]/route'
import { mockPrismaRound, mockPrismaUser, resetMocks } from './mocks/prisma'
import { createMockRequest } from './mocks/nextRequest'

// Mock console methods to avoid cluttering test output
vi.spyOn(console, 'error').mockImplementation(() => {})

describe('GET /api/rounds/[id]', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('should return a round by id', async () => {
    const mockRound = {
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
    }

    mockPrismaRound.findUnique.mockResolvedValue(mockRound)

    const request = createMockRequest('GET')
    const response = await GET(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe(1)
    expect(data.courseName).toBe('Pebble Beach')
    expect(data.score).toBe(85)
    expect(data.user.id).toBe(1)
    expect(mockPrismaRound.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  })

  it('should return 404 when round not found', async () => {
    mockPrismaRound.findUnique.mockResolvedValue(null)

    const request = createMockRequest('GET')
    const response = await GET(request, { params: { id: '999' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data).toEqual({ error: 'Round not found' })
  })

  it('should handle database errors', async () => {
    mockPrismaRound.findUnique.mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('GET')
    const response = await GET(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to fetch round' })
  })
})

describe('PUT /api/rounds/[id]', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('should update a round with valid data', async () => {
    const updateData = {
      courseName: 'Updated Course',
      score: 78,
      notes: 'Updated notes',
    }

    const updatedRound = {
      id: 1,
      userId: 1,
      courseName: 'Updated Course',
      datePlayed: new Date('2024-01-15'),
      score: 78,
      holes: 18,
      courseRating: 72.5,
      slopeRating: 135,
      notes: 'Updated notes',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
      },
    }

    mockPrismaRound.update.mockResolvedValue(updatedRound)

    const request = createMockRequest('PUT', updateData)
    const response = await PUT(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe(1)
    expect(data.courseName).toBe('Updated Course')
    expect(data.score).toBe(78)
    expect(data.notes).toBe('Updated notes')
    expect(mockPrismaRound.update).toHaveBeenCalled()
  })

  it('should update only score', async () => {
    const updateData = {
      score: 92,
    }

    const updatedRound = {
      id: 1,
      userId: 1,
      courseName: 'Pebble Beach',
      datePlayed: new Date('2024-01-15'),
      score: 92,
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
    }

    mockPrismaRound.update.mockResolvedValue(updatedRound)

    const request = createMockRequest('PUT', updateData)
    const response = await PUT(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.score).toBe(92)
  })

  it('should update userId if user exists', async () => {
    const updateData = {
      userId: 2,
    }

    const updatedRound = {
      id: 1,
      userId: 2,
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
        id: 2,
        name: 'User 2',
        email: 'user2@example.com',
      },
    }

    mockPrismaUser.findUnique.mockResolvedValue({
      id: 2,
      name: 'User 2',
      email: 'user2@example.com',
      handicapIndex: null,
      rounds: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    mockPrismaRound.update.mockResolvedValue(updatedRound)

    const request = createMockRequest('PUT', updateData)
    const response = await PUT(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.userId).toBe(2)
    expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
      where: { id: 2 },
    })
  })

  it('should return 404 when updating with non-existent userId', async () => {
    const updateData = {
      userId: 999,
    }

    mockPrismaUser.findUnique.mockResolvedValue(null)

    const request = createMockRequest('PUT', updateData)
    const response = await PUT(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data).toEqual({ error: 'User not found' })
    expect(mockPrismaRound.update).not.toHaveBeenCalled()
  })

  it('should reject invalid score', async () => {
    const updateData = {
      score: -5,
    }

    const request = createMockRequest('PUT', updateData)
    const response = await PUT(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation error')
  })

  it('should reject empty courseName', async () => {
    const updateData = {
      courseName: '',
    }

    const request = createMockRequest('PUT', updateData)
    const response = await PUT(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation error')
  })

  it('should reject invalid holes value', async () => {
    const updateData = {
      holes: 27,
    }

    const request = createMockRequest('PUT', updateData)
    const response = await PUT(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation error')
  })

  it('should handle database errors', async () => {
    const updateData = {
      score: 88,
    }

    mockPrismaRound.update.mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('PUT', updateData)
    const response = await PUT(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to update round' })
  })
})

describe('DELETE /api/rounds/[id]', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('should delete a round', async () => {
    mockPrismaRound.delete.mockResolvedValue({
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
    })

    const request = createMockRequest('DELETE')
    const response = await DELETE(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ message: 'Round deleted successfully' })
    expect(mockPrismaRound.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    })
  })

  it('should handle non-existent round deletion', async () => {
    mockPrismaRound.delete.mockRejectedValue(new Error('Record not found'))

    const request = createMockRequest('DELETE')
    const response = await DELETE(request, { params: { id: '999' } })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to delete round' })
  })

  it('should handle database errors', async () => {
    mockPrismaRound.delete.mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('DELETE')
    const response = await DELETE(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to delete round' })
  })
})
