import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateRoundSchema } from '@/lib/validation'
import { z } from 'zod'
import { getCurrentUser, requireResourceAccess, createAuthErrorResponse } from '@/lib/auth-utils'
import { Role } from '@prisma/client'
import { calculateHandicapDifferential } from '@/lib/handicap-calculator'

// GET /api/rounds/[id] - Get a single round (own round or admin)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const currentUser = await getCurrentUser()

    const round = await prisma.round.findUnique({
      where: { id: parseInt(params.id) },
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

    if (!round) {
      return NextResponse.json(
        { error: 'Round not found' },
        { status: 404 }
      )
    }

    // Check access: user can view own rounds, admins can view any
    await requireResourceAccess(round.userId)

    return NextResponse.json(round)
  } catch (error) {
    // Handle auth errors
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return createAuthErrorResponse(error, error.message.includes('Forbidden') ? 403 : 401)
    }

    console.error('Error fetching round:', error)
    return NextResponse.json(
      { error: 'Failed to fetch round' },
      { status: 500 }
    )
  }
}

// PUT /api/rounds/[id] - Update a round (own round or admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const currentUser = await getCurrentUser()

    // First, get the existing round to check ownership
    const existingRound = await prisma.round.findUnique({
      where: { id: parseInt(params.id) },
    })

    if (!existingRound) {
      return NextResponse.json(
        { error: 'Round not found' },
        { status: 404 }
      )
    }

    // Check access: user can update own rounds, admins can update any
    await requireResourceAccess(existingRound.userId)

    const body = await request.json()

    // Convert datePlayed to Date if it's a string
    if (body.datePlayed && typeof body.datePlayed === 'string') {
      body.datePlayed = new Date(body.datePlayed)
    }

    // Validate input
    const validatedData = updateRoundSchema.parse(body)

    // If userId is being updated, check authorization and user existence
    if (validatedData.userId && validatedData.userId !== existingRound.userId) {
      // Only admins can change the userId of a round
      if (currentUser.role !== Role.ADMIN) {
        return createAuthErrorResponse(
          new Error('Forbidden: Only admins can change round ownership'),
          403
        )
      }

      const userExists = await prisma.user.findUnique({
        where: { id: validatedData.userId },
      })

      if (!userExists) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
    }

    // Recalculate handicap differential if relevant fields changed
    const finalScore = validatedData.score ?? existingRound.score
    const finalCourseRating = validatedData.courseRating ?? existingRound.courseRating
    const finalSlopeRating = validatedData.slopeRating ?? existingRound.slopeRating

    const handicapDifferential = calculateHandicapDifferential(
      finalScore,
      finalCourseRating,
      finalSlopeRating
    )

    // Update round
    const round = await prisma.round.update({
      where: { id: parseInt(params.id) },
      data: {
        ...validatedData,
        datePlayed: validatedData.datePlayed
          ? validatedData.datePlayed instanceof Date
            ? validatedData.datePlayed
            : new Date(validatedData.datePlayed)
          : undefined,
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

    return NextResponse.json(round)
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

    console.error('Error updating round:', error)
    return NextResponse.json(
      { error: 'Failed to update round' },
      { status: 500 }
    )
  }
}

// DELETE /api/rounds/[id] - Delete a round (own round or admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const currentUser = await getCurrentUser()

    // First, get the existing round to check ownership
    const existingRound = await prisma.round.findUnique({
      where: { id: parseInt(params.id) },
    })

    if (!existingRound) {
      return NextResponse.json(
        { error: 'Round not found' },
        { status: 404 }
      )
    }

    // Check access: user can delete own rounds, admins can delete any
    await requireResourceAccess(existingRound.userId)

    await prisma.round.delete({
      where: { id: parseInt(params.id) },
    })

    return NextResponse.json({ message: 'Round deleted successfully' })
  } catch (error) {
    // Handle auth errors
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return createAuthErrorResponse(error, error.message.includes('Forbidden') ? 403 : 401)
    }

    console.error('Error deleting round:', error)
    return NextResponse.json(
      { error: 'Failed to delete round' },
      { status: 500 }
    )
  }
}
