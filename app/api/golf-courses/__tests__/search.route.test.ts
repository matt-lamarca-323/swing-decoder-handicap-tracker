import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '../search/route'
import { NextRequest } from 'next/server'

// Mock fetch globally
global.fetch = vi.fn()

// Set API key for tests
process.env.GOLF_COURSE_API_KEY = 'test-api-key-123'

describe('GET /api/golf-courses/search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should successfully search for golf courses', async () => {
    const mockCourses = {
      courses: [
        {
          id: 12345,
          club_name: 'Pebble Beach Golf Links',
          course_name: 'Pebble Beach',
          location: {
            address: '1700 17-Mile Drive, Pebble Beach, CA 93953'
          }
        },
        {
          id: 67890,
          club_name: 'Pebble Beach Resorts',
          course_name: 'Spyglass Hill',
          location: {
            address: '1700 17-Mile Drive, Pebble Beach, CA 93953'
          }
        }
      ]
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCourses
    })

    const request = new NextRequest('http://localhost:3000/api/golf-courses/search?query=pebble')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockCourses)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.golfcourseapi.com/v1/search?search_query=pebble',
      {
        headers: {
          'Authorization': 'Key test-api-key-123',
          'Content-Type': 'application/json',
        },
      }
    )
  })

  it('should encode special characters in search query', async () => {
    const mockCourses = { courses: [] }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCourses
    })

    const request = new NextRequest('http://localhost:3000/api/golf-courses/search?query=St. Andrews & Royal')

    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.golfcourseapi.com/v1/search?search_query=St.%20Andrews%20%26%20Royal',
      expect.any(Object)
    )
  })

  it('should return error when API returns non-ok response', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized: Invalid API key'
    })

    const request = new NextRequest('http://localhost:3000/api/golf-courses/search?query=pebble')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Failed to search golf courses')
    expect(data.details).toBe('Unauthorized: Invalid API key')
  })

  it('should return 500 on network error', async () => {
    ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

    const request = new NextRequest('http://localhost:3000/api/golf-courses/search?query=pebble')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })

  it('should handle empty search results', async () => {
    const mockCourses = { courses: [] }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCourses
    })

    const request = new NextRequest('http://localhost:3000/api/golf-courses/search?query=nonexistentcourse123')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.courses).toEqual([])
  })

  it('should handle rate limiting from Golf Course API', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => 'Rate limit exceeded'
    })

    const request = new NextRequest('http://localhost:3000/api/golf-courses/search?query=pebble')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toBe('Failed to search golf courses')
    expect(data.details).toBe('Rate limit exceeded')
  })

  it('should handle multiple search results', async () => {
    const mockCourses = {
      courses: [
        { id: 1, club_name: 'Augusta National', course_name: 'Augusta', location: { address: 'Augusta, GA' } },
        { id: 2, club_name: 'Augusta CC', course_name: 'East Course', location: { address: 'Augusta, GA' } },
        { id: 3, club_name: 'Augusta Hills', course_name: 'Main', location: { address: 'Augusta, ME' } }
      ]
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCourses
    })

    const request = new NextRequest('http://localhost:3000/api/golf-courses/search?query=augusta')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.courses).toHaveLength(3)
    expect(data.courses[0].club_name).toBe('Augusta National')
  })
})
