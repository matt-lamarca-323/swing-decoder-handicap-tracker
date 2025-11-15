import { NextRequest, NextResponse } from 'next/server'

const GOLF_COURSE_API_BASE = 'https://api.golfcourseapi.com/v1'
const API_KEY = process.env.GOLF_COURSE_API_KEY

/**
 * Search for golf courses
 * GET /api/golf-courses/search?query=pinehurst
 */
export async function GET(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'Golf Course API key not configured. Please add GOLF_COURSE_API_KEY to your .env file.' },
        { status: 500 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')

    if (!query) {
      return NextResponse.json(
        { error: 'Missing required query parameter: query' },
        { status: 400 }
      )
    }

    // Call Golf Course API
    const response = await fetch(
      `${GOLF_COURSE_API_BASE}/search?search_query=${encodeURIComponent(query)}`,
      {
        headers: {
          'Authorization': `Key ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Golf Course API error:', response.status, errorText)
      return NextResponse.json(
        { error: 'Failed to search golf courses', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error searching golf courses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
