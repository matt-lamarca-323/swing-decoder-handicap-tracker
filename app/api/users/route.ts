import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { userSchema } from '@/lib/validation'
import { z } from 'zod'
import { requireAdmin, createAuthErrorResponse } from '@/lib/auth-utils'
import { logger } from '@/lib/logger'

// GET /api/users - Get all users (Admin only)
export async function GET() {
  const startTime = logger.startTimer()

  try {
    // Require admin access
    const currentUser = await requireAdmin()
    logger.apiRequest('GET', '/api/users', currentUser.id, currentUser.role)

    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    const duration = logger.endTimer(startTime)
    logger.dbQuery('findMany', 'User', duration, users.length)
    logger.apiResponse('GET', '/api/users', 200, duration, currentUser.id)

    return NextResponse.json(users)
  } catch (error) {
    const duration = logger.endTimer(startTime)

    // Handle auth errors
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      const statusCode = error.message.includes('Forbidden') ? 403 : 401
      logger.apiError('GET', '/api/users', error, statusCode)
      return createAuthErrorResponse(error, statusCode)
    }

    logger.apiError('GET', '/api/users', error as Error, 500)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create a new user (Admin only)
export async function POST(request: NextRequest) {
  const startTime = logger.startTimer()

  try {
    // Require admin access
    const currentUser = await requireAdmin()
    const body = await request.json()

    logger.apiRequest('POST', '/api/users', currentUser.id, currentUser.role)
    logger.debug('Creating new user', {
      request: { body: { email: body.email, name: body.name } }
    })

    // Validate input
    const validatedData = userSchema.parse(body)

    // Create user
    const user = await prisma.user.create({
      data: validatedData,
    })

    const duration = logger.endTimer(startTime)
    logger.dbQuery('create', 'User', duration, 1)
    logger.info('User created successfully', {
      database: { operation: 'create', model: 'User', recordId: user.id },
      user: { email: user.email, role: user.role }
    })
    logger.apiResponse('POST', '/api/users', 201, duration, currentUser.id)

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    const duration = logger.endTimer(startTime)

    // Handle auth errors
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      const statusCode = error.message.includes('Forbidden') ? 403 : 401
      logger.apiError('POST', '/api/users', error, statusCode)
      return createAuthErrorResponse(error, statusCode)
    }

    if (error instanceof z.ZodError) {
      logger.warn('User creation validation failed', {
        validation: { errors: error.errors }
      })
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    logger.apiError('POST', '/api/users', error as Error, 500)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
