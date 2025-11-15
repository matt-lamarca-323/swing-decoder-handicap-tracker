import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-utils'
import { calculateGIR } from '@/lib/golf-calculator'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const searchParams = request.nextUrl.searchParams

    // Get filter parameters
    const filter = searchParams.get('filter') // 'last5', 'last10', 'last15', 'last20', 'alltime', 'daterange', 'course'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const courseName = searchParams.get('courseName')

    // Build where clause
    const where: any = {
      userId: user.id,
    }

    // Apply filters
    if (filter === 'daterange' && startDate && endDate) {
      where.datePlayed = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    } else if (filter === 'course' && courseName) {
      where.courseName = courseName
    }

    // Fetch rounds
    let rounds = await prisma.round.findMany({
      where,
      orderBy: { datePlayed: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    // Apply round count filters
    if (filter === 'last5') {
      rounds = rounds.slice(0, 5)
    } else if (filter === 'last10') {
      rounds = rounds.slice(0, 10)
    } else if (filter === 'last15') {
      rounds = rounds.slice(0, 15)
    } else if (filter === 'last20') {
      rounds = rounds.slice(0, 20)
    }

    // Calculate statistics
    const stats = calculateStats(rounds)

    return NextResponse.json({
      rounds,
      stats,
      filter,
    })
  } catch (error: any) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateStats(rounds: any[]) {
  if (rounds.length === 0) {
    return {
      totalRounds: 0,
      girPercentage: 0,
      firPercentage: 0,
      avgPutts: 0,
      avgPuttsPerGIR: 0,
      avgScore: 0,
      firStreak: 0,
      no3PuttStreak: 0,
      noDoubleBogeyStreak: 0,
    }
  }

  let totalGIR = 0
  let totalGIROpportunities = 0
  let totalFIR = 0
  let totalFIROpportunities = 0
  let totalPutts = 0
  let totalPuttsOnGIR = 0
  let totalGIRHit = 0
  let totalScore = 0
  let puttsCount = 0

  // For streaks, we need hole-by-hole data
  let currentFIRStreak = 0
  let longestFIRStreak = 0
  let currentNo3PuttStreak = 0
  let longestNo3PuttStreak = 0
  let currentNoDoubleBogeyStreak = 0
  let longestNoDoubleBogeyStreak = 0

  rounds.forEach(round => {
    totalScore += round.score

    if (round.putts) {
      totalPutts += round.putts
      puttsCount++
    }

    if (round.girPutts) {
      totalPuttsOnGIR += round.girPutts
    }

    // Parse hole-by-hole data for detailed stats
    if (round.holeByHoleData) {
      const holeData = Array.isArray(round.holeByHoleData)
        ? round.holeByHoleData
        : JSON.parse(round.holeByHoleData)

      holeData.forEach((hole: any) => {
        // GIR calculation
        totalGIROpportunities++
        if (hole.score > 0 && hole.putts >= 0) {
          const hitGIR = calculateGIR(hole.par, hole.score, hole.putts)
          if (hitGIR) {
            totalGIR++
            totalGIRHit++
          }
        }

        // FIR calculation (par 4 and 5 only)
        if (hole.par > 3) {
          totalFIROpportunities++
          if (hole.fairwayHit === true) {
            totalFIR++
            currentFIRStreak++
            longestFIRStreak = Math.max(longestFIRStreak, currentFIRStreak)
          } else if (hole.fairwayHit === false) {
            currentFIRStreak = 0
          }
        }

        // No 3-putt streak
        if (hole.putts !== undefined && hole.putts !== null) {
          if (hole.putts < 3) {
            currentNo3PuttStreak++
            longestNo3PuttStreak = Math.max(longestNo3PuttStreak, currentNo3PuttStreak)
          } else if (hole.putts >= 3) {
            currentNo3PuttStreak = 0
          }
        }

        // No double bogey streak
        if (hole.score > 0 && hole.par > 0) {
          const scoreToPar = hole.score - hole.par
          if (scoreToPar < 2) {
            currentNoDoubleBogeyStreak++
            longestNoDoubleBogeyStreak = Math.max(longestNoDoubleBogeyStreak, currentNoDoubleBogeyStreak)
          } else {
            currentNoDoubleBogeyStreak = 0
          }
        }
      })
    }
  })

  const girPercentage = totalGIROpportunities > 0
    ? (totalGIR / totalGIROpportunities) * 100
    : 0

  const firPercentage = totalFIROpportunities > 0
    ? (totalFIR / totalFIROpportunities) * 100
    : 0

  const avgPutts = puttsCount > 0 ? totalPutts / puttsCount : 0
  const avgPuttsPerGIR = totalGIRHit > 0 ? totalPuttsOnGIR / totalGIRHit : 0
  const avgScore = rounds.length > 0 ? totalScore / rounds.length : 0

  return {
    totalRounds: rounds.length,
    girPercentage: parseFloat(girPercentage.toFixed(1)),
    firPercentage: parseFloat(firPercentage.toFixed(1)),
    avgPutts: parseFloat(avgPutts.toFixed(1)),
    avgPuttsPerGIR: parseFloat(avgPuttsPerGIR.toFixed(1)),
    avgScore: parseFloat(avgScore.toFixed(1)),
    firStreak: longestFIRStreak,
    no3PuttStreak: longestNo3PuttStreak,
    noDoubleBogeyStreak: longestNoDoubleBogeyStreak,
    totalGIR,
    totalGIROpportunities,
    totalFIR,
    totalFIROpportunities,
  }
}
