import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '../dashboard/route'
import { mockPrismaUser, resetMocks } from './mocks/prisma'

// Mock getCurrentUser from auth-utils
vi.mock('@/lib/auth-utils', () => ({
  getCurrentUser: vi.fn().mockResolvedValue({
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER'
  }),
  createAuthErrorResponse: vi.fn((error: Error, status: number) => {
    return new Response(JSON.stringify({ error: error.message }), {
      status,
      headers: { 'Content-Type': 'application/json' }
    })
  })
}))

// Mock console methods to avoid cluttering test output
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})

describe('GET /api/dashboard', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('should return dashboard stats with all data', async () => {
    const mockUserWithRounds = {
      handicapIndex: 15.2,
      Round: [
        {
          id: 1,
          courseName: 'Pebble Beach',
          datePlayed: new Date('2024-01-15'),
          score: 85,
          holes: 18,
          greensInRegulation: 9,
          fairwaysInRegulation: 7,
          putts: 32,
          upAndDowns: 3,
          upAndDownAttempts: 9,
        },
        {
          id: 2,
          courseName: 'Augusta National',
          datePlayed: new Date('2024-01-10'),
          score: 90,
          holes: 18,
          greensInRegulation: 6,
          fairwaysInRegulation: 5,
          putts: 36,
          upAndDowns: 4,
          upAndDownAttempts: 12,
        },
        {
          id: 3,
          courseName: 'St Andrews',
          datePlayed: new Date('2024-01-05'),
          score: 88,
          holes: 18,
          greensInRegulation: 8,
          fairwaysInRegulation: 6,
          putts: 34,
          upAndDowns: 2,
          upAndDownAttempts: 10,
        },
      ],
    }

    mockPrismaUser.findUnique.mockResolvedValue(mockUserWithRounds)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.handicapIndex).toBe(15.2)
    expect(data.totalRounds).toBe(3)
    expect(data.averageScore).toBe(87.7) // (85 + 90 + 88) / 3 = 87.67 rounded to 87.7
    expect(data.greensInRegulationPct).toBe(42.6) // (9+6+8)/(18*3) = 23/54 = 42.59 rounded to 42.6
    expect(data.fairwaysInRegulationPct).toBe(42.9) // (7+5+6)/42 = 18/42 = 42.86 rounded to 42.9
    expect(data.averagePutts).toBe(34.0) // (32 + 36 + 34) / 3
    expect(data.upAndDownPct).toBe(29.0) // (3+4+2)/(9+12+10) = 9/31 = 29.03 rounded to 29.0
    expect(data.recentRounds).toHaveLength(3)
    expect(data.recentRounds[0].courseName).toBe('Pebble Beach')

    expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: {
        handicapIndex: true,
        Round: {
          select: {
            id: true,
            courseName: true,
            datePlayed: true,
            score: true,
            holes: true,
            greensInRegulation: true,
            fairwaysInRegulation: true,
            putts: true,
            upAndDowns: true,
            upAndDownAttempts: true,
          },
          orderBy: {
            datePlayed: 'desc',
          },
        },
      },
    })
  })

  it('should return null stats when no rounds exist', async () => {
    const mockUserNoRounds = {
      handicapIndex: null,
      Round: [],
    }

    mockPrismaUser.findUnique.mockResolvedValue(mockUserNoRounds)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.handicapIndex).toBe(null)
    expect(data.totalRounds).toBe(0)
    expect(data.averageScore).toBe(null)
    expect(data.greensInRegulationPct).toBe(null)
    expect(data.fairwaysInRegulationPct).toBe(null)
    expect(data.averagePutts).toBe(null)
    expect(data.upAndDownPct).toBe(null)
    expect(data.recentRounds).toHaveLength(0)
  })

  it('should handle rounds with partial statistics', async () => {
    const mockUserPartialStats = {
      handicapIndex: 12.5,
      Round: [
        {
          id: 1,
          courseName: 'Course 1',
          datePlayed: new Date('2024-01-15'),
          score: 85,
          holes: 18,
          greensInRegulation: 9,
          fairwaysInRegulation: null,
          putts: null,
          upAndDowns: null,
          upAndDownAttempts: null,
        },
        {
          id: 2,
          courseName: 'Course 2',
          datePlayed: new Date('2024-01-10'),
          score: 90,
          holes: 18,
          greensInRegulation: null,
          fairwaysInRegulation: null,
          putts: 36,
          upAndDowns: null,
          upAndDownAttempts: null,
        },
      ],
    }

    mockPrismaUser.findUnique.mockResolvedValue(mockUserPartialStats)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.totalRounds).toBe(2)
    expect(data.greensInRegulationPct).toBe(50.0) // Only 1 round has GIR: 9/18 = 50%
    expect(data.fairwaysInRegulationPct).toBe(null) // No rounds with FIR
    expect(data.averagePutts).toBe(36.0) // Only 1 round has putts
    expect(data.upAndDownPct).toBe(null) // No rounds with up&down data
  })

  it('should handle 9-hole rounds correctly', async () => {
    const mockUserMixedHoles = {
      handicapIndex: 10.0,
      Round: [
        {
          id: 1,
          courseName: '18 Hole Course',
          datePlayed: new Date('2024-01-15'),
          score: 85,
          holes: 18,
          greensInRegulation: 9,
          fairwaysInRegulation: 7,
          putts: 32,
          upAndDowns: 3,
          upAndDownAttempts: 9,
        },
        {
          id: 2,
          courseName: '9 Hole Course',
          datePlayed: new Date('2024-01-10'),
          score: 45,
          holes: 9,
          greensInRegulation: 4,
          fairwaysInRegulation: 3,
          putts: 16,
          upAndDowns: 2,
          upAndDownAttempts: 5,
        },
      ],
    }

    mockPrismaUser.findUnique.mockResolvedValue(mockUserMixedHoles)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.totalRounds).toBe(2)
    // Average score only counts 18-hole rounds
    expect(data.averageScore).toBe(85.0)
    // GIR should account for different hole counts: (9+4)/(18+9) = 13/27 = 48.1%
    expect(data.greensInRegulationPct).toBe(48.1)
    // FIR accounts for 14 fairways per 18 holes, 7 per 9 holes: (7+3)/(14+7) = 10/21 = 47.6%
    expect(data.fairwaysInRegulationPct).toBe(47.6)
    expect(data.averagePutts).toBe(24.0) // (32 + 16) / 2
    expect(data.upAndDownPct).toBe(35.7) // (3+2)/(9+5) = 5/14 = 35.71%
  })

  it('should return recent 5 rounds only', async () => {
    const mockUserManyRounds = {
      handicapIndex: 8.5,
      Round: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        courseName: `Course ${i + 1}`,
        datePlayed: new Date(`2024-01-${20 - i}`),
        score: 80 + i,
        holes: 18,
        greensInRegulation: 9,
        fairwaysInRegulation: 7,
        putts: 32,
        upAndDowns: 3,
        upAndDownAttempts: 9,
      })),
    }

    mockPrismaUser.findUnique.mockResolvedValue(mockUserManyRounds)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.totalRounds).toBe(10)
    expect(data.recentRounds).toHaveLength(5)
    expect(data.recentRounds[0].courseName).toBe('Course 1')
    expect(data.recentRounds[4].courseName).toBe('Course 5')
  })

  it('should return 404 when user not found', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(null)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('User not found')
  })

  it('should handle database errors', async () => {
    mockPrismaUser.findUnique.mockRejectedValue(new Error('Database connection error'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch dashboard stats')
  })

  it('should handle authentication errors', async () => {
    const { getCurrentUser } = await import('@/lib/auth-utils')
    vi.mocked(getCurrentUser).mockRejectedValueOnce(new Error('Unauthorized'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('Unauthorized')

    // Reset mock for other tests
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER'
    })
  })

  it('should handle forbidden errors', async () => {
    const { getCurrentUser } = await import('@/lib/auth-utils')
    vi.mocked(getCurrentUser).mockRejectedValueOnce(new Error('Forbidden'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toContain('Forbidden')

    // Reset mock for other tests
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER'
    })
  })

  it('should calculate correct averages with precision', async () => {
    const mockUserPrecision = {
      handicapIndex: 7.3,
      Round: [
        {
          id: 1,
          courseName: 'Course A',
          datePlayed: new Date('2024-01-15'),
          score: 73,
          holes: 18,
          greensInRegulation: 13,
          fairwaysInRegulation: 10,
          putts: 29,
          upAndDowns: 3,
          upAndDownAttempts: 5,
        },
        {
          id: 2,
          courseName: 'Course B',
          datePlayed: new Date('2024-01-10'),
          score: 76,
          holes: 18,
          greensInRegulation: 12,
          fairwaysInRegulation: 9,
          putts: 31,
          upAndDowns: 2,
          upAndDownAttempts: 6,
        },
        {
          id: 3,
          courseName: 'Course C',
          datePlayed: new Date('2024-01-05'),
          score: 75,
          holes: 18,
          greensInRegulation: 11,
          fairwaysInRegulation: 8,
          putts: 30,
          upAndDowns: 4,
          upAndDownAttempts: 7,
        },
      ],
    }

    mockPrismaUser.findUnique.mockResolvedValue(mockUserPrecision)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    // Average score: (73 + 76 + 75) / 3 = 74.667... → 74.7
    expect(data.averageScore).toBe(74.7)
    // GIR%: (13+12+11)/(18*3) = 36/54 = 66.667... → 66.7
    expect(data.greensInRegulationPct).toBe(66.7)
    // FIR%: (10+9+8)/42 = 27/42 = 64.286... → 64.3
    expect(data.fairwaysInRegulationPct).toBe(64.3)
    // Avg putts: (29+31+30)/3 = 90/3 = 30.0
    expect(data.averagePutts).toBe(30.0)
    // Up&down%: (3+2+4)/(5+6+7) = 9/18 = 50.0
    expect(data.upAndDownPct).toBe(50.0)
  })

  it('should handle rounds with zero up and down attempts', async () => {
    const mockUserAllGIR = {
      handicapIndex: 5.0,
      Round: [
        {
          id: 1,
          courseName: 'Perfect Round',
          datePlayed: new Date('2024-01-15'),
          score: 72,
          holes: 18,
          greensInRegulation: 18,
          fairwaysInRegulation: 14,
          putts: 36,
          upAndDowns: 0,
          upAndDownAttempts: 0, // All GIR, no up&down attempts
        },
      ],
    }

    mockPrismaUser.findUnique.mockResolvedValue(mockUserAllGIR)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.upAndDownPct).toBe(null) // No attempts = null percentage
  })
})
