import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  // Parse DATABASE_URL to show connection details (without password)
  const parseConnectionString = (url: string | undefined) => {
    if (!url) return null

    try {
      const parsed = new URL(url)
      return {
        protocol: parsed.protocol.replace(':', ''),
        host: parsed.hostname,
        port: parsed.port || '5432',
        database: parsed.pathname.replace('/', ''),
        username: parsed.username,
        queryParams: parsed.search || 'none',
        passwordSet: !!parsed.password
      }
    } catch (e) {
      return { error: 'Invalid URL format' }
    }
  }

  const connectionInfo = parseConnectionString(process.env.DATABASE_URL)

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
      connectionInfo,
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
        connectionInfo,
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
