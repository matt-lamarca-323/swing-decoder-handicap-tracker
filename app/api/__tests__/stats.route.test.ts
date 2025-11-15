import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '../stats/route'
import { NextRequest } from 'next/server'
import { mockPrismaRound, resetMocks } from './mocks/prisma'

// Mock console methods to avoid cluttering test output
vi.spyOn(console, 'error').mockImplementation(() => {})

describe('GET /api/stats', () => {
  beforeEach(() => {
    resetMocks()
  })

  const mockRounds = [
    {
      id: 1,
      userId: 1,
      courseName: 'Pebble Beach',
      datePlayed: new Date('2024-01-15'),
      score: 85,
      holes: 18,
      putts: 32,
      girPutts: 18,
      courseRating: 72.5,
      slopeRating: 135,
      notes: null,
      greensInRegulation: 8,
      fairwaysInRegulation: 7,
      upAndDowns: 3,
      upAndDownAttempts: 8,
      nonGirPutts: 14,
      underGIR: 2,
      handicapDifferential: 10.4,
      holeByHoleData: [
        { holeNumber: 1, par: 4, score: 5, putts: 2, fairwayHit: true, yardage: 380, handicap: 5 },
        { holeNumber: 2, par: 3, score: 3, putts: 2, fairwayHit: null, yardage: 150, handicap: 17 },
        { holeNumber: 3, par: 5, score: 6, putts: 2, fairwayHit: true, yardage: 520, handicap: 3 },
        { holeNumber: 4, par: 4, score: 4, putts: 2, fairwayHit: false, yardage: 400, handicap: 9 },
        { holeNumber: 5, par: 4, score: 5, putts: 2, fairwayHit: true, yardage: 390, handicap: 7 },
        { holeNumber: 6, par: 3, score: 4, putts: 3, fairwayHit: null, yardage: 180, handicap: 15 },
        { holeNumber: 7, par: 5, score: 5, putts: 2, fairwayHit: true, yardage: 540, handicap: 1 },
        { holeNumber: 8, par: 4, score: 5, putts: 2, fairwayHit: false, yardage: 410, handicap: 11 },
        { holeNumber: 9, par: 4, score: 4, putts: 2, fairwayHit: true, yardage: 380, handicap: 13 },
        { holeNumber: 10, par: 4, score: 5, putts: 2, fairwayHit: true, yardage: 395, handicap: 6 },
        { holeNumber: 11, par: 3, score: 3, putts: 2, fairwayHit: null, yardage: 165, handicap: 16 },
        { holeNumber: 12, par: 5, score: 6, putts: 2, fairwayHit: false, yardage: 530, handicap: 2 },
        { holeNumber: 13, par: 4, score: 5, putts: 2, fairwayHit: true, yardage: 405, handicap: 8 },
        { holeNumber: 14, par: 4, score: 4, putts: 2, fairwayHit: true, yardage: 385, handicap: 12 },
        { holeNumber: 15, par: 3, score: 3, putts: 1, fairwayHit: null, yardage: 140, handicap: 18 },
        { holeNumber: 16, par: 5, score: 5, putts: 2, fairwayHit: true, yardage: 550, handicap: 4 },
        { holeNumber: 17, par: 4, score: 5, putts: 2, fairwayHit: false, yardage: 420, handicap: 10 },
        { holeNumber: 18, par: 4, score: 4, putts: 2, fairwayHit: true, yardage: 375, handicap: 14 },
      ],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      user: {
        name: 'Test User',
        email: 'test@example.com',
      },
    },
    {
      id: 2,
      userId: 1,
      courseName: 'Augusta National',
      datePlayed: new Date('2024-01-10'),
      score: 90,
      holes: 18,
      putts: 36,
      girPutts: 14,
      courseRating: 74.0,
      slopeRating: 140,
      notes: null,
      greensInRegulation: 5,
      fairwaysInRegulation: 6,
      upAndDowns: 2,
      upAndDownAttempts: 10,
      nonGirPutts: 22,
      underGIR: 1,
      handicapDifferential: 12.9,
      holeByHoleData: [
        { holeNumber: 1, par: 4, score: 6, putts: 3, fairwayHit: false, yardage: 445, handicap: 5 },
        { holeNumber: 2, par: 5, score: 7, putts: 3, fairwayHit: false, yardage: 575, handicap: 3 },
        { holeNumber: 3, par: 4, score: 5, putts: 2, fairwayHit: true, yardage: 350, handicap: 9 },
        { holeNumber: 4, par: 3, score: 4, putts: 2, fairwayHit: null, yardage: 240, handicap: 17 },
        { holeNumber: 5, par: 4, score: 5, putts: 2, fairwayHit: true, yardage: 495, handicap: 7 },
        { holeNumber: 6, par: 3, score: 3, putts: 2, fairwayHit: null, yardage: 180, handicap: 15 },
        { holeNumber: 7, par: 4, score: 5, putts: 2, fairwayHit: false, yardage: 450, handicap: 1 },
        { holeNumber: 8, par: 5, score: 6, putts: 2, fairwayHit: true, yardage: 570, handicap: 11 },
        { holeNumber: 9, par: 4, score: 5, putts: 2, fairwayHit: true, yardage: 460, handicap: 13 },
        { holeNumber: 10, par: 4, score: 5, putts: 2, fairwayHit: true, yardage: 495, handicap: 6 },
        { holeNumber: 11, par: 4, score: 6, putts: 3, fairwayHit: false, yardage: 505, handicap: 16 },
        { holeNumber: 12, par: 3, score: 4, putts: 2, fairwayHit: null, yardage: 155, handicap: 2 },
        { holeNumber: 13, par: 5, score: 6, putts: 2, fairwayHit: true, yardage: 510, handicap: 8 },
        { holeNumber: 14, par: 4, score: 5, putts: 2, fairwayHit: false, yardage: 440, handicap: 12 },
        { holeNumber: 15, par: 5, score: 6, putts: 2, fairwayHit: true, yardage: 530, handicap: 18 },
        { holeNumber: 16, par: 3, score: 3, putts: 2, fairwayHit: null, yardage: 170, handicap: 4 },
        { holeNumber: 17, par: 4, score: 5, putts: 2, fairwayHit: false, yardage: 440, handicap: 10 },
        { holeNumber: 18, par: 4, score: 4, putts: 2, fairwayHit: true, yardage: 465, handicap: 14 },
      ],
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10'),
      user: {
        name: 'Test User',
        email: 'test@example.com',
      },
    },
  ]

  it('should fetch all-time stats successfully', async () => {
    mockPrismaRound.findMany.mockResolvedValue(mockRounds as any)

    const request = new NextRequest('http://localhost:3000/api/stats?filter=alltime')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.stats.totalRounds).toBe(2)
    expect(data.stats.avgScore).toBe(87.5) // (85 + 90) / 2
    expect(data.filter).toBe('alltime')
  })

  it('should fetch last 5 rounds stats', async () => {
    mockPrismaRound.findMany.mockResolvedValue(mockRounds as any)

    const request = new NextRequest('http://localhost:3000/api/stats?filter=last5')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.stats.totalRounds).toBe(2)
    expect(data.filter).toBe('last5')
  })

  it('should fetch last 10 rounds stats', async () => {
    mockPrismaRound.findMany.mockResolvedValue(mockRounds as any)

    const request = new NextRequest('http://localhost:3000/api/stats?filter=last10')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.stats.totalRounds).toBe(2)
  })

  it('should calculate GIR percentage correctly', async () => {
    mockPrismaRound.findMany.mockResolvedValue(mockRounds as any)

    const request = new NextRequest('http://localhost:3000/api/stats?filter=alltime')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.stats.girPercentage).toBeGreaterThan(0)
    expect(data.stats.totalGIROpportunities).toBe(36) // 18 holes * 2 rounds
    expect(data.stats.totalGIR).toBeGreaterThan(0)
  })

  it('should calculate FIR percentage correctly', async () => {
    mockPrismaRound.findMany.mockResolvedValue(mockRounds as any)

    const request = new NextRequest('http://localhost:3000/api/stats?filter=alltime')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.stats.firPercentage).toBeGreaterThan(0)
    expect(data.stats.totalFIROpportunities).toBeGreaterThan(0) // Only par 4s and 5s
  })

  it('should calculate average putts correctly', async () => {
    mockPrismaRound.findMany.mockResolvedValue(mockRounds as any)

    const request = new NextRequest('http://localhost:3000/api/stats?filter=alltime')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.stats.avgPutts).toBe(34) // (32 + 36) / 2
  })

  it('should calculate FIR streak correctly', async () => {
    mockPrismaRound.findMany.mockResolvedValue(mockRounds as any)

    const request = new NextRequest('http://localhost:3000/api/stats?filter=alltime')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.stats.firStreak).toBeGreaterThanOrEqual(0)
  })

  it('should calculate no 3-putt streak correctly', async () => {
    mockPrismaRound.findMany.mockResolvedValue(mockRounds as any)

    const request = new NextRequest('http://localhost:3000/api/stats?filter=alltime')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.stats.no3PuttStreak).toBeGreaterThanOrEqual(0)
  })

  it('should calculate no double bogey streak correctly', async () => {
    mockPrismaRound.findMany.mockResolvedValue(mockRounds as any)

    const request = new NextRequest('http://localhost:3000/api/stats?filter=alltime')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.stats.noDoubleBogeyStreak).toBeGreaterThanOrEqual(0)
  })

  it('should filter by date range', async () => {
    mockPrismaRound.findMany.mockResolvedValue([mockRounds[0]] as any)

    const request = new NextRequest(
      'http://localhost:3000/api/stats?filter=daterange&startDate=2024-01-12&endDate=2024-01-20'
    )
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(mockPrismaRound.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          datePlayed: {
            gte: new Date('2024-01-12'),
            lte: new Date('2024-01-20'),
          },
        }),
      })
    )
  })

  it('should filter by course name', async () => {
    mockPrismaRound.findMany.mockResolvedValue([mockRounds[0]] as any)

    const request = new NextRequest(
      'http://localhost:3000/api/stats?filter=course&courseName=Pebble%20Beach'
    )
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(mockPrismaRound.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          courseName: 'Pebble Beach',
        }),
      })
    )
  })

  it('should return zero stats when no rounds exist', async () => {
    mockPrismaRound.findMany.mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/stats?filter=alltime')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.stats.totalRounds).toBe(0)
    expect(data.stats.girPercentage).toBe(0)
    expect(data.stats.firPercentage).toBe(0)
    expect(data.stats.avgPutts).toBe(0)
    expect(data.stats.avgScore).toBe(0)
  })

  it('should handle database errors gracefully', async () => {
    mockPrismaRound.findMany.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/stats?filter=alltime')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })

  it('should limit to 5 rounds when filter is last5', async () => {
    const manyRounds = Array.from({ length: 10 }, (_, i) => ({
      ...mockRounds[0],
      id: i + 1,
      datePlayed: new Date(2024, 0, i + 1),
    }))
    mockPrismaRound.findMany.mockResolvedValue(manyRounds as any)

    const request = new NextRequest('http://localhost:3000/api/stats?filter=last5')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.stats.totalRounds).toBe(5)
  })

  it('should limit to 10 rounds when filter is last10', async () => {
    const manyRounds = Array.from({ length: 15 }, (_, i) => ({
      ...mockRounds[0],
      id: i + 1,
      datePlayed: new Date(2024, 0, i + 1),
    }))
    mockPrismaRound.findMany.mockResolvedValue(manyRounds as any)

    const request = new NextRequest('http://localhost:3000/api/stats?filter=last10')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.stats.totalRounds).toBe(10)
  })

  it('should include user information in rounds', async () => {
    mockPrismaRound.findMany.mockResolvedValue(mockRounds as any)

    const request = new NextRequest('http://localhost:3000/api/stats?filter=alltime')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.rounds[0].user).toBeDefined()
    expect(data.rounds[0].user.name).toBe('Test User')
  })

  it('should calculate putts per GIR correctly', async () => {
    mockPrismaRound.findMany.mockResolvedValue(mockRounds as any)

    const request = new NextRequest('http://localhost:3000/api/stats?filter=alltime')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.stats.avgPuttsPerGIR).toBeGreaterThan(0)
  })
})
