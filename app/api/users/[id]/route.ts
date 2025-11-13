import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateUserSchema } from '@/lib/validation'
import { z } from 'zod'
import { requireResourceAccess, requireAdmin, createAuthErrorResponse } from '@/lib/auth-utils'

// GET /api/users/[id] - Get a single user (own profile or admin)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id)

    // Check access: user can view own profile, admins can view any
    await requireResourceAccess(userId)

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    // Handle auth errors
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return createAuthErrorResponse(error, error.message.includes('Forbidden') ? 403 : 401)
    }

    console.error('Error fetching user:', error)
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
  try {
    const userId = parseInt(params.id)

    // Check access: user can update own profile, admins can update any
    await requireResourceAccess(userId)

    const body = await request.json()

    // Validate input
    const validatedData = updateUserSchema.parse(body)

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: validatedData,
    })

    return NextResponse.json(user)
  } catch (error) {
    // Handle auth errors
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return createAuthErrorResponse(error, error.message.includes('Forbidden') ? 403 : 401)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating user:', error)
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
  try {
    // Only admins can delete users
    await requireAdmin()

    await prisma.user.delete({
      where: { id: parseInt(params.id) },
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    // Handle auth errors
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return createAuthErrorResponse(error, error.message.includes('Forbidden') ? 403 : 401)
    }

    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
