import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateResetToken, getResetTokenExpiry } from '@/lib/password'
import { z } from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = forgotPasswordSchema.parse(body)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    // Don't reveal if user exists or not for security
    if (!user || !user.password) {
      // Return success even if user doesn't exist to prevent email enumeration
      return NextResponse.json({
        message: 'If an account with that email exists, a password reset link has been sent.'
      })
    }

    // Generate reset token
    const resetToken = generateResetToken()
    const resetTokenExpiry = getResetTokenExpiry()

    // Save reset token to database
    await prisma.user.update({
      where: { email: validatedData.email },
      data: {
        resetToken,
        resetTokenExpiry,
      }
    })

    // In a production app, you would send an email here
    // For now, we'll log the reset link
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`

    console.log('========================================')
    console.log(`Password reset requested for: ${user.email}`)
    console.log(`Reset URL: ${resetUrl}`)
    console.log(`Token expires: ${resetTokenExpiry}`)
    console.log('========================================')

    // TODO: Send email with reset link
    // await sendPasswordResetEmail(user.email, resetUrl)

    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
      // Remove this in production - only for development
      ...(process.env.NODE_ENV === 'development' && {
        resetUrl,
        note: 'In production, this link would be sent via email'
      })
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error processing password reset request:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
