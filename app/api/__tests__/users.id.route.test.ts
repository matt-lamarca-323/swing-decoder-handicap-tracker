import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, PUT, DELETE } from '../users/[id]/route'
import { mockPrismaUser, resetMocks } from './mocks/prisma'
import { createMockRequest } from './mocks/nextRequest'

// Mock console methods to avoid cluttering test output
vi.spyOn(console, 'error').mockImplementation(() => {})

describe('GET /api/users/[id]', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('should return a user by id', async () => {
    const mockUser = {
      id: 1,
      email: 'user@example.com',
      name: 'Test User',
      handicapIndex: 12.5,
      rounds: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockPrismaUser.findUnique.mockResolvedValue(mockUser)

    const request = createMockRequest('GET')
    const response = await GET(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe(1)
    expect(data.email).toBe('user@example.com')
    expect(data.name).toBe('Test User')
    expect(data.handicapIndex).toBe(12.5)
    expect(data.rounds).toBe(10)
    expect(data.createdAt).toBeDefined()
    expect(data.updatedAt).toBeDefined()
    expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
    })
  })

  it('should return 404 when user not found', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(null)

    const request = createMockRequest('GET')
    const response = await GET(request, { params: { id: '999' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data).toEqual({ error: 'User not found' })
  })

  it('should handle database errors', async () => {
    mockPrismaUser.findUnique.mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('GET')
    const response = await GET(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to fetch user' })
  })
})

describe('PUT /api/users/[id]', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('should update a user with valid data', async () => {
    const updateData = {
      name: 'Updated Name',
      handicapIndex: 10.0,
    }

    const updatedUser = {
      id: 1,
      email: 'user@example.com',
      name: 'Updated Name',
      handicapIndex: 10.0,
      rounds: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockPrismaUser.update.mockResolvedValue(updatedUser)

    const request = createMockRequest('PUT', updateData)
    const response = await PUT(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe(1)
    expect(data.name).toBe('Updated Name')
    expect(data.handicapIndex).toBe(10.0)
    expect(data.rounds).toBe(10)
    expect(data.createdAt).toBeDefined()
    expect(data.updatedAt).toBeDefined()
    expect(mockPrismaUser.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: updateData,
    })
  })

  it('should update only email', async () => {
    const updateData = {
      email: 'newemail@example.com',
    }

    const updatedUser = {
      id: 1,
      email: 'newemail@example.com',
      name: 'Test User',
      handicapIndex: 12.5,
      rounds: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockPrismaUser.update.mockResolvedValue(updatedUser)

    const request = createMockRequest('PUT', updateData)
    const response = await PUT(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.email).toBe('newemail@example.com')
  })

  it('should update only handicapIndex', async () => {
    const updateData = {
      handicapIndex: 5.5,
    }

    const updatedUser = {
      id: 1,
      email: 'user@example.com',
      name: 'Test User',
      handicapIndex: 5.5,
      rounds: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockPrismaUser.update.mockResolvedValue(updatedUser)

    const request = createMockRequest('PUT', updateData)
    const response = await PUT(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.handicapIndex).toBe(5.5)
  })

  it('should reject invalid email', async () => {
    const updateData = {
      email: 'invalid-email',
    }

    const request = createMockRequest('PUT', updateData)
    const response = await PUT(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation error')
    expect(mockPrismaUser.update).not.toHaveBeenCalled()
  })

  it('should reject empty name', async () => {
    const updateData = {
      name: '',
    }

    const request = createMockRequest('PUT', updateData)
    const response = await PUT(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation error')
  })

  it('should reject negative rounds', async () => {
    const updateData = {
      rounds: -5,
    }

    const request = createMockRequest('PUT', updateData)
    const response = await PUT(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation error')
  })

  it('should handle database errors', async () => {
    const updateData = {
      name: 'Updated Name',
    }

    mockPrismaUser.update.mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('PUT', updateData)
    const response = await PUT(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to update user' })
  })
})

describe('DELETE /api/users/[id]', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('should delete a user', async () => {
    mockPrismaUser.delete.mockResolvedValue({
      id: 1,
      email: 'user@example.com',
      name: 'Test User',
      handicapIndex: 12.5,
      rounds: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const request = createMockRequest('DELETE')
    const response = await DELETE(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ message: 'User deleted successfully' })
    expect(mockPrismaUser.delete).toHaveBeenCalledWith({
      where: { id: '1' },
    })
  })

  it('should handle non-existent user deletion', async () => {
    mockPrismaUser.delete.mockRejectedValue(new Error('Record not found'))

    const request = createMockRequest('DELETE')
    const response = await DELETE(request, { params: { id: '999' } })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to delete user' })
  })

  it('should handle database errors', async () => {
    mockPrismaUser.delete.mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('DELETE')
    const response = await DELETE(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to delete user' })
  })
})
