import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateUserSchema } from '@/lib/validation'
import { z } from 'zod'
import { requireResourceAccess, requireAdmin, createAuthErrorResponse, getCurrentUser } from '@/lib/auth-utils'
import { logger } from '@/lib/logger'

// GET /api/users/[id] - Get a single user (own profile or admin)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = logger.startTimer()
  const userId = parseInt(params.id)

  try {
    const currentUser = await getCurrentUser()
    logger.apiRequest('GET', `/api/users/${userId}`, currentUser.id, currentUser.role)

    // Check access: user can view own profile, admins can view any
    await requireResourceAccess(userId)

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      logger.warn('User not found', {
        request: { userId, currentUserId: currentUser.id }
      })
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const duration = logger.endTimer(startTime)
    logger.dbQuery('findUnique', 'User', duration, 1)
    logger.apiResponse('GET', `/api/users/${userId}`, 200, duration, currentUser.id)

    return NextResponse.json(user)
  } catch (error) {
    const duration = logger.endTimer(startTime)

    // Handle auth errors
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      const statusCode = error.message.includes('Forbidden') ? 403 : 401
      logger.apiError('GET', `/api/users/${userId}`, error, statusCode)
      return createAuthErrorResponse(error, statusCode)
    }

    logger.apiError('GET', `/api/users/${userId}`, error as Error, 500)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update a user (own profile or admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = logger.startTimer()
  const userId = parseInt(params.id)

  try {
    const currentUser = await getCurrentUser()
    logger.apiRequest('PUT', `/api/users/${userId}`, currentUser.id, currentUser.role)

    // Check access: user can update own profile, admins can update any
    await requireResourceAccess(userId)

    const body = await request.json()
    logger.debug('Updating user', {
      request: { userId, updateFields: Object.keys(body) }
    })

    // Validate input
    const validatedData = updateUserSchema.parse(body)

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: validatedData,
    })

    const duration = logger.endTimer(startTime)
    logger.dbQuery('update', 'User', duration, 1)
    logger.info('User updated successfully', {
      database: { operation: 'update', model: 'User', recordId: userId },
      user: { email: user.email }
    })
    logger.apiResponse('PUT', `/api/users/${userId}`, 200, duration, currentUser.id)

    return NextResponse.json(user)
  } catch (error) {
    const duration = logger.endTimer(startTime)

    // Handle auth errors
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      const statusCode = error.message.includes('Forbidden') ? 403 : 401
      logger.apiError('PUT', `/api/users/${userId}`, error, statusCode)
      return createAuthErrorResponse(error, statusCode)
    }

    if (error instanceof z.ZodError) {
      logger.warn('User update validation failed', {
        validation: { errors: error.errors },
        request: { userId }
      })
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    logger.apiError('PUT', `/api/users/${userId}`, error as Error, 500)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete a user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = logger.startTimer()
  const userId = parseInt(params.id)

  try {
    // Only admins can delete users
    const currentUser = await requireAdmin()
    logger.apiRequest('DELETE', `/api/users/${userId}`, currentUser.id, currentUser.role)

    await prisma.user.delete({
      where: { id: userId },
    })

    const duration = logger.endTimer(startTime)
    logger.dbQuery('delete', 'User', duration, 1)
    logger.info('User deleted successfully', {
      database: { operation: 'delete', model: 'User', recordId: userId }
    })
    logger.apiResponse('DELETE', `/api/users/${userId}`, 200, duration, currentUser.id)

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    const duration = logger.endTimer(startTime)

    // Handle auth errors
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      const statusCode = error.message.includes('Forbidden') ? 403 : 401
      logger.apiError('DELETE', `/api/users/${userId}`, error, statusCode)
      return createAuthErrorResponse(error, statusCode)
    }

    logger.apiError('DELETE', `/api/users/${userId}`, error as Error, 500)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
