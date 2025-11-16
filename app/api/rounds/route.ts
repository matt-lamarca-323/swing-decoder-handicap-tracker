import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { roundSchema } from '@/lib/validation'
import { z } from 'zod'
import { getCurrentUser, isAdmin, createAuthErrorResponse } from '@/lib/auth-utils'
import { Role } from '@prisma/client'
import { calculateHandicapDifferential } from '@/lib/handicap-calculator'

// GET /api/rounds - Get rounds (own rounds or all if admin in admin mode)
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const currentUser = await getCurrentUser()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const adminMode = searchParams.get('adminMode') === 'true'

    let whereClause = {}

    // If user is admin AND in admin mode, they can see all rounds or filter by userId
    if (currentUser.role === Role.ADMIN && adminMode) {
      whereClause = userId ? { userId: parseInt(userId) } : {}
    } else {
      // Regular users or admins in standard mode can only see their own rounds
      whereClause = { userId: parseInt(currentUser.id) }
    }

    const rounds = await prisma.round.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        datePlayed: 'desc',
      },
    })
    return NextResponse.json(rounds)
  } catch (error) {
    // Handle auth errors
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return createAuthErrorResponse(error, error.message.includes('Forbidden') ? 403 : 401)
    }

    console.error('Error fetching rounds:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rounds' },
      { status: 500 }
    )
  }
}

// POST /api/rounds - Create a new round
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const currentUser = await getCurrentUser()

    const body = await request.json()

    // Convert datePlayed to Date if it's a string
    if (body.datePlayed && typeof body.datePlayed === 'string') {
      body.datePlayed = new Date(body.datePlayed)
    }

    // Validate input
    const validatedData = roundSchema.parse(body)

    // Check authorization: users can only create rounds for themselves, admins can create for anyone
    if (currentUser.role !== Role.ADMIN && validatedData.userId !== parseInt(currentUser.id)) {
      return createAuthErrorResponse(
        new Error('Forbidden: You can only create rounds for yourself'),
        403
      )
    }

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: validatedData.userId },
    })

    if (!userExists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate handicap differential
    const handicapDifferential = calculateHandicapDifferential(
      validatedData.score,
      validatedData.courseRating ?? null,
      validatedData.slopeRating ?? null
    )

    // Create round
    const round = await prisma.round.create({
      data: {
        ...validatedData,
        datePlayed: validatedData.datePlayed instanceof Date
          ? validatedData.datePlayed
          : new Date(validatedData.datePlayed),
        handicapDifferential,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(round, { status: 201 })
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

    console.error('Error creating round:', error)
    return NextResponse.json(
      { error: 'Failed to create round' },
      { status: 500 }
    )
  }
}
