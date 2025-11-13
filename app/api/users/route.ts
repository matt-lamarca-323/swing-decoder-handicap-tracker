import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { userSchema } from '@/lib/validation'
import { z } from 'zod'
import { requireAdmin, createAuthErrorResponse } from '@/lib/auth-utils'

// GET /api/users - Get all users (Admin only)
export async function GET() {
  try {
    // Require admin access
    await requireAdmin()

    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json(users)
  } catch (error) {
    // Handle auth errors
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return createAuthErrorResponse(error, error.message.includes('Forbidden') ? 403 : 401)
    }

    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create a new user (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Require admin access
    await requireAdmin()

    const body = await request.json()

    // Validate input
    const validatedData = userSchema.parse(body)

    // Create user
    const user = await prisma.user.create({
      data: validatedData,
    })

    return NextResponse.json(user, { status: 201 })
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

    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
