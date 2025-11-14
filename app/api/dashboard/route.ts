import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, createAuthErrorResponse } from '@/lib/auth-utils'
import { logger } from '@/lib/logger'
import { calculateHandicapIndexFromRounds, getNumberOfDifferentialsUsed } from '@/lib/handicap-calculator'

export interface DashboardStats {
  handicapIndex: number | null
  calculatedHandicapIndex: number | null
  numberOfDifferentialsUsed: number
  totalRounds: number
  roundsWithDifferential: number
  averageScore: number | null
  greensInRegulationPct: number | null
  fairwaysInRegulationPct: number | null
  averagePutts: number | null
  upAndDownPct: number | null
  recentRounds: Array<{
    id: number
    courseName: string
    datePlayed: string
    score: number
    holes: number
    handicapDifferential: number | null
  }>
}

// GET /api/dashboard - Get dashboard statistics for current user
export async function GET() {
  const startTime = logger.startTimer()

  try {
    const currentUser = await getCurrentUser()
    logger.apiRequest('GET', '/api/dashboard', currentUser.id, currentUser.role)

    // Get user with handicap info
    const user = await prisma.user.findUnique({
      where: { id: parseInt(currentUser.id) },
      select: {
        handicapIndex: true,
        Round: {
          select: {
            id: true,
            courseName: true,
            datePlayed: true,
            score: true,
            holes: true,
            courseRating: true,
            slopeRating: true,
            greensInRegulation: true,
            fairwaysInRegulation: true,
            putts: true,
            upAndDowns: true,
            upAndDownAttempts: true,
            handicapDifferential: true,
          },
          orderBy: {
            datePlayed: 'desc',
          },
        },
      },
    })

    if (!user) {
      logger.warn('User not found for dashboard', {
        request: { userId: currentUser.id }
      })
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const rounds = user.Round
    const totalRounds = rounds.length

    // Calculate average score (only 18-hole rounds for accurate handicap)
    const eighteenHoleRounds = rounds.filter(r => r.holes === 18)
    const averageScore = eighteenHoleRounds.length > 0
      ? eighteenHoleRounds.reduce((sum, r) => sum + r.score, 0) / eighteenHoleRounds.length
      : null

    // Calculate GIR percentage
    const roundsWithGIR = rounds.filter(r => r.greensInRegulation !== null)
    const totalGIR = roundsWithGIR.reduce((sum, r) => sum + (r.greensInRegulation || 0), 0)
    const totalGreens = roundsWithGIR.reduce((sum, r) => sum + r.holes, 0)
    const greensInRegulationPct = totalGreens > 0 ? (totalGIR / totalGreens) * 100 : null

    // Calculate FIR percentage (typically 14 fairways per 18-hole round, scaled for 9-hole)
    const roundsWithFIR = rounds.filter(r => r.fairwaysInRegulation !== null)
    const totalFIR = roundsWithFIR.reduce((sum, r) => sum + (r.fairwaysInRegulation || 0), 0)
    const totalFairways = roundsWithFIR.reduce((sum, r) => {
      // Approximately 14 fairways per 18 holes (7 per 9 holes)
      return sum + (r.holes === 18 ? 14 : 7)
    }, 0)
    const fairwaysInRegulationPct = totalFairways > 0 ? (totalFIR / totalFairways) * 100 : null

    // Calculate average putts
    const roundsWithPutts = rounds.filter(r => r.putts !== null)
    const averagePutts = roundsWithPutts.length > 0
      ? roundsWithPutts.reduce((sum, r) => sum + (r.putts || 0), 0) / roundsWithPutts.length
      : null

    // Calculate up and down percentage
    const roundsWithUpDown = rounds.filter(r => r.upAndDowns !== null && r.upAndDownAttempts !== null)
    const totalUpDowns = roundsWithUpDown.reduce((sum, r) => sum + (r.upAndDowns || 0), 0)
    const totalUpDownAttempts = roundsWithUpDown.reduce((sum, r) => sum + (r.upAndDownAttempts || 0), 0)
    const upAndDownPct = totalUpDownAttempts > 0 ? (totalUpDowns / totalUpDownAttempts) * 100 : null

    // Calculate handicap index from rounds
    const calculatedHandicapIndex = calculateHandicapIndexFromRounds(rounds.map(r => ({
      id: r.id,
      score: r.score,
      courseRating: r.courseRating,
      slopeRating: r.slopeRating,
      handicapDifferential: r.handicapDifferential,
      datePlayed: r.datePlayed,
    })))

    // Count rounds with valid differential
    const roundsWithDifferential = rounds.filter(r => r.handicapDifferential !== null).length
    const numberOfDifferentialsUsed = getNumberOfDifferentialsUsed(roundsWithDifferential)

    // Get recent 5 rounds
    const recentRounds = rounds.slice(0, 5).map(r => ({
      id: r.id,
      courseName: r.courseName,
      datePlayed: r.datePlayed.toISOString(),
      score: r.score,
      holes: r.holes,
      handicapDifferential: r.handicapDifferential,
    }))

    const stats: DashboardStats = {
      handicapIndex: user.handicapIndex,
      calculatedHandicapIndex,
      numberOfDifferentialsUsed,
      totalRounds,
      roundsWithDifferential,
      averageScore: averageScore ? Math.round(averageScore * 10) / 10 : null,
      greensInRegulationPct: greensInRegulationPct ? Math.round(greensInRegulationPct * 10) / 10 : null,
      fairwaysInRegulationPct: fairwaysInRegulationPct ? Math.round(fairwaysInRegulationPct * 10) / 10 : null,
      averagePutts: averagePutts ? Math.round(averagePutts * 10) / 10 : null,
      upAndDownPct: upAndDownPct ? Math.round(upAndDownPct * 10) / 10 : null,
      recentRounds,
    }

    const duration = logger.endTimer(startTime)
    logger.info('Dashboard stats calculated', {
      database: { operation: 'aggregate', model: 'Round', recordCount: totalRounds },
      performance: { duration_ms: duration },
      stats: {
        totalRounds,
        hasHandicap: user.handicapIndex !== null,
        statsAvailable: {
          gir: greensInRegulationPct !== null,
          fir: fairwaysInRegulationPct !== null,
          putts: averagePutts !== null,
          upDown: upAndDownPct !== null,
        }
      }
    })
    logger.apiResponse('GET', '/api/dashboard', 200, duration, currentUser.id)

    return NextResponse.json(stats)
  } catch (error) {
    const duration = logger.endTimer(startTime)

    // Handle auth errors
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      const statusCode = error.message.includes('Forbidden') ? 403 : 401
      logger.apiError('GET', '/api/dashboard', error, statusCode)
      return createAuthErrorResponse(error, statusCode)
    }

    logger.apiError('GET', '/api/dashboard', error as Error, 500)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
