import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, isResetTokenExpired } from '@/lib/password'
import { z } from 'zod'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = resetPasswordSchema.parse(body)

    // Find user by reset token
    const user = await prisma.user.findUnique({
      where: { resetToken: validatedData.token }
    })

    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (isResetTokenExpired(user.resetTokenExpiry)) {
      // Clear expired token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: null,
          resetTokenExpiry: null,
        }
      })

      return NextResponse.json(
        { error: 'Reset token has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Hash the new password
    const hashedPassword = await hashPassword(validatedData.password)

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      }
    })

    console.log(`Password reset successfully for: ${user.email}`)

    return NextResponse.json({
      message: 'Password reset successfully. You can now sign in with your new password.'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error resetting password:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
