import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '../[id]/route'
import { NextRequest } from 'next/server'

// Mock fetch globally
global.fetch = vi.fn()

// Set API key for tests
process.env.GOLF_COURSE_API_KEY = 'test-api-key-123'

describe('GET /api/golf-courses/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should successfully fetch course details', async () => {
    const mockCourseDetails = {
      id: 12345,
      club_name: 'Pebble Beach Golf Links',
      course_name: 'Pebble Beach',
      location: {
        address: '1700 17-Mile Drive, Pebble Beach, CA 93953',
        city: 'Pebble Beach',
        state: 'California',
        country: 'United States',
        latitude: 36.5674,
        longitude: -121.9500
      },
      tees: {
        male: [
          {
            tee_name: 'Championship',
            course_rating: 75.5,
            slope_rating: 145,
            bogey_rating: 101.5,
            total_yards: 6828,
            total_meters: 6242,
            number_of_holes: 18,
            par_total: 72,
            front_course_rating: 37.2,
            front_slope_rating: 143,
            front_bogey_rating: 50.1,
            back_course_rating: 38.3,
            back_slope_rating: 147,
            back_bogey_rating: 51.4,
            holes: Array(18).fill({ par: 4, yardage: 380, handicap: 10 })
          }
        ],
        female: [
          {
            tee_name: 'Forward',
            course_rating: 69.8,
            slope_rating: 125,
            bogey_rating: 91.2,
            total_yards: 5198,
            total_meters: 4752,
            number_of_holes: 18,
            par_total: 72,
            front_course_rating: 34.5,
            front_slope_rating: 123,
            front_bogey_rating: 45.2,
            back_course_rating: 35.3,
            back_slope_rating: 127,
            back_bogey_rating: 46.0,
            holes: Array(18).fill({ par: 4, yardage: 289, handicap: 10 })
          }
        ]
      }
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCourseDetails
    })

    const request = new NextRequest('http://localhost:3000/api/golf-courses/12345')

    const response = await GET(request, { params: { id: '12345' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockCourseDetails)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.golfcourseapi.com/v1/courses/12345',
      {
        headers: {
          'Authorization': 'Key test-api-key-123',
          'Content-Type': 'application/json',
        },
      }
    )
  })

  it('should return 404 when course is not found', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => 'Course not found'
    })

    const request = new NextRequest('http://localhost:3000/api/golf-courses/99999')

    const response = await GET(request, { params: { id: '99999' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Failed to fetch course details')
    expect(data.details).toBe('Course not found')
  })

  it('should return error when API returns non-ok response', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized: Invalid API key'
    })

    const request = new NextRequest('http://localhost:3000/api/golf-courses/12345')

    const response = await GET(request, { params: { id: '12345' } })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Failed to fetch course details')
    expect(data.details).toBe('Unauthorized: Invalid API key')
  })

  it('should return 500 on network error', async () => {
    ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

    const request = new NextRequest('http://localhost:3000/api/golf-courses/12345')

    const response = await GET(request, { params: { id: '12345' } })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })

  it('should handle rate limiting from Golf Course API', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => 'Rate limit exceeded'
    })

    const request = new NextRequest('http://localhost:3000/api/golf-courses/12345')

    const response = await GET(request, { params: { id: '12345' } })
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toBe('Failed to fetch course details')
    expect(data.details).toBe('Rate limit exceeded')
  })

  it('should handle different course ID formats', async () => {
    const mockCourse = {
      id: 789,
      club_name: 'Test Course',
      course_name: 'Test',
      location: { address: '123 Test St', city: 'Test City', state: 'TS', country: 'USA', latitude: 0, longitude: 0 },
      tees: { male: [], female: [] }
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCourse
    })

    const request = new NextRequest('http://localhost:3000/api/golf-courses/789')

    const response = await GET(request, { params: { id: '789' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockCourse)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.golfcourseapi.com/v1/courses/789',
      expect.any(Object)
    )
  })

  it('should verify course has both male and female tees', async () => {
    const mockCourse = {
      id: 456,
      club_name: 'Augusta National',
      course_name: 'Augusta',
      location: {
        address: '2604 Washington Road, Augusta, GA 30904',
        city: 'Augusta',
        state: 'Georgia',
        country: 'United States',
        latitude: 33.5027,
        longitude: -82.0199
      },
      tees: {
        male: [
          {
            tee_name: 'Masters',
            course_rating: 76.2,
            slope_rating: 137,
            bogey_rating: 102.8,
            total_yards: 7475,
            total_meters: 6836,
            number_of_holes: 18,
            par_total: 72,
            front_course_rating: 37.8,
            front_slope_rating: 135,
            front_bogey_rating: 51.0,
            back_course_rating: 38.4,
            back_slope_rating: 139,
            back_bogey_rating: 51.8,
            holes: Array(18).fill({ par: 4, yardage: 415, handicap: 1 })
          }
        ],
        female: [
          {
            tee_name: 'Forward',
            course_rating: 70.5,
            slope_rating: 128,
            bogey_rating: 93.2,
            total_yards: 5425,
            total_meters: 4960,
            number_of_holes: 18,
            par_total: 72,
            front_course_rating: 35.0,
            front_slope_rating: 126,
            front_bogey_rating: 46.3,
            back_course_rating: 35.5,
            back_slope_rating: 130,
            back_bogey_rating: 46.9,
            holes: Array(18).fill({ par: 4, yardage: 300, handicap: 1 })
          }
        ]
      }
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCourse
    })

    const request = new NextRequest('http://localhost:3000/api/golf-courses/456')

    const response = await GET(request, { params: { id: '456' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.tees).toHaveProperty('male')
    expect(data.tees).toHaveProperty('female')
    expect(Array.isArray(data.tees.male)).toBe(true)
    expect(Array.isArray(data.tees.female)).toBe(true)
    expect(data.tees.male.length).toBeGreaterThan(0)
    expect(data.tees.female.length).toBeGreaterThan(0)
  })

  it('should verify tee data structure contains required fields', async () => {
    const mockCourse = {
      id: 999,
      club_name: 'Test Club',
      course_name: 'Test Course',
      location: { address: 'Test Address', city: 'Test', state: 'Test', country: 'Test', latitude: 0, longitude: 0 },
      tees: {
        male: [
          {
            tee_name: 'Blue',
            course_rating: 72.0,
            slope_rating: 130,
            bogey_rating: 95.0,
            total_yards: 6500,
            total_meters: 5944,
            number_of_holes: 18,
            par_total: 72,
            front_course_rating: 36.0,
            front_slope_rating: 128,
            front_bogey_rating: 47.5,
            back_course_rating: 36.0,
            back_slope_rating: 132,
            back_bogey_rating: 47.5,
            holes: [
              { par: 4, yardage: 400, handicap: 1 },
              { par: 5, yardage: 550, handicap: 5 }
            ]
          }
        ],
        female: []
      }
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCourse
    })

    const request = new NextRequest('http://localhost:3000/api/golf-courses/999')

    const response = await GET(request, { params: { id: '999' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    const tee = data.tees.male[0]
    expect(tee).toHaveProperty('tee_name')
    expect(tee).toHaveProperty('course_rating')
    expect(tee).toHaveProperty('slope_rating')
    expect(tee).toHaveProperty('total_yards')
    expect(tee).toHaveProperty('number_of_holes')
    expect(tee).toHaveProperty('par_total')
    expect(tee).toHaveProperty('holes')
    expect(Array.isArray(tee.holes)).toBe(true)
    expect(tee.holes[0]).toHaveProperty('par')
    expect(tee.holes[0]).toHaveProperty('yardage')
    expect(tee.holes[0]).toHaveProperty('handicap')
  })
})
