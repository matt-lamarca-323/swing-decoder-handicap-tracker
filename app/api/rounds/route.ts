import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { roundSchema } from '@/lib/validation'
import { z } from 'zod'

// GET /api/rounds - Get all rounds (with optional userId filter)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const whereClause = userId ? { userId: parseInt(userId) } : {}

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
    const body = await request.json()

    // Convert datePlayed to Date if it's a string
    if (body.datePlayed && typeof body.datePlayed === 'string') {
      body.datePlayed = new Date(body.datePlayed)
    }

    // Validate input
    const validatedData = roundSchema.parse(body)

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

    // Create round
    const round = await prisma.round.create({
      data: {
        ...validatedData,
        datePlayed: validatedData.datePlayed instanceof Date
          ? validatedData.datePlayed
          : new Date(validatedData.datePlayed),
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
