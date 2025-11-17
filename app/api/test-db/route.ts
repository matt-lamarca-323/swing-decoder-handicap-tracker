import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test database connection by querying the database
    const startTime = Date.now()

    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1`

    const duration = Date.now() - startTime

    // Try to get user count
    const userCount = await prisma.user.count()

    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      details: {
        connected: true,
        responseTime: `${duration}ms`,
        userCount,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Database connection error:', error)

    return NextResponse.json(
      {
        status: 'error',
        message: 'Database connection failed',
        details: {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}
