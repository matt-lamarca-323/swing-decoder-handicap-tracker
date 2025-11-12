import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateRoundSchema } from '@/lib/validation'
import { z } from 'zod'

// GET /api/rounds/[id] - Get a single round
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    return NextResponse.json(round)
  } catch (error) {
    console.error('Error fetching round:', error)
    return NextResponse.json(
      { error: 'Failed to fetch round' },
      { status: 500 }
    )
  }
}

// PUT /api/rounds/[id] - Update a round
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Convert datePlayed to Date if it's a string
    if (body.datePlayed && typeof body.datePlayed === 'string') {
      body.datePlayed = new Date(body.datePlayed)
    }

    // Validate input
    const validatedData = updateRoundSchema.parse(body)

    // If userId is being updated, check if user exists
    if (validatedData.userId) {
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

// DELETE /api/rounds/[id] - Delete a round
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.round.delete({
      where: { id: parseInt(params.id) },
    })

    return NextResponse.json({ message: 'Round deleted successfully' })
  } catch (error) {
    console.error('Error deleting round:', error)
    return NextResponse.json(
      { error: 'Failed to delete round' },
      { status: 500 }
    )
  }
}
