import { NextResponse } from 'next/server'

export async function GET() {
  // Function to safely preview environment variable values
  const previewValue = (value: string | undefined, showChars = 20): string => {
    if (!value) return 'NOT SET'
    if (value.length <= showChars) return `${value.substring(0, 10)}...`
    return `${value.substring(0, showChars)}...`
  }

  // Get all environment variables
  const allEnvKeys = Object.keys(process.env).sort()

  // Create a map of all env variables with partial values
  const allEnvPreview: Record<string, string> = {}
  allEnvKeys.forEach(key => {
    // Show more characters for non-sensitive variables
    const showChars = ['NODE_ENV', 'PORT', 'HOSTNAME', 'AUTH_URL', 'NEXTAUTH_URL'].includes(key) ? 100 : 20
    allEnvPreview[key] = previewValue(process.env[key], showChars)
  })

  // Check specific variables we need
  const requiredVars = {
    DATABASE_URL: previewValue(process.env.DATABASE_URL, 30),
    AUTH_SECRET: previewValue(process.env.AUTH_SECRET, 15),
    AUTH_URL: previewValue(process.env.AUTH_URL, 100),
    AUTH_GOOGLE_ID: previewValue(process.env.AUTH_GOOGLE_ID, 25),
    AUTH_GOOGLE_SECRET: previewValue(process.env.AUTH_GOOGLE_SECRET, 15),
    GOLF_COURSE_API_KEY: previewValue(process.env.GOLF_COURSE_API_KEY, 15),
    NODE_ENV: process.env.NODE_ENV || 'NOT SET',
  }

  // Count how many variables are set
  const stats = {
    totalEnvVars: allEnvKeys.length,
    requiredVarsSet: Object.values(requiredVars).filter(v => v !== 'NOT SET').length,
    requiredVarsTotal: Object.keys(requiredVars).length
  }

  return NextResponse.json({
    stats,
    requiredVariables: requiredVars,
    allEnvironmentVariables: allEnvPreview,
    timestamp: new Date().toISOString()
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }
  })
}
