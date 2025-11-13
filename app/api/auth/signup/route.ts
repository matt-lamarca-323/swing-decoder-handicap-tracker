import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { z } from 'zod'
import { Role } from '@prisma/client'

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = signUpSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    // Hash the password
    const hashedPassword = await hashPassword(validatedData.password)

    // Check if this is the first user (will be admin)
    const userCount = await prisma.user.count()
    const role = userCount === 0 ? Role.ADMIN : Role.USER

    // Create the user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        role: role,
        emailVerified: new Date(), // Auto-verify for email/password signups
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      }
    })

    console.log(`New user created: ${user.email} (${user.role})`)

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
      { status: 201 }
    )
  } catch (error) {
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
