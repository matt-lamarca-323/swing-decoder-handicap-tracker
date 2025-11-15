import { NextRequest, NextResponse } from 'next/server'

const GOLF_COURSE_API_BASE = 'https://api.golfcourseapi.com/v1'

/**
 * Get golf course details by ID
 * GET /api/golf-courses/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get API key from environment
    const API_KEY = process.env.GOLF_COURSE_API_KEY

    // Check if API key is configured
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'Golf Course API key not configured. Please add GOLF_COURSE_API_KEY to your .env file.' },
        { status: 500 }
      )
    }

    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Missing course ID' },
        { status: 400 }
      )
    }

    // Call Golf Course API
    const response = await fetch(
      `${GOLF_COURSE_API_BASE}/courses/${id}`,
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
        { error: 'Failed to fetch course details', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()

    // The API returns { course: {...} }, so unwrap it
    const courseData = data.course || data
    return NextResponse.json(courseData)
  } catch (error) {
    console.error('Error fetching course details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
