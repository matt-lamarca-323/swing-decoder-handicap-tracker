import { NextResponse } from 'next/server'

export async function GET() {
  // Function to safely preview environment variable values
  const previewValue = (value: string | undefined, showChars = 20): string => {
    if (!value) return 'NOT SET'
    if (value.length <= showChars) return `${value.substring(0, 10)}...`
    return `${value.substring(0, showChars)}...`
  }

  // Parse DATABASE_URL to show connection details (without password)
  const parseConnectionString = (url: string | undefined) => {
    if (!url) return null

    try {
      const parsed = new URL(url)
      return {
        protocol: parsed.protocol.replace(':', ''),
        host: parsed.hostname,
        port: parsed.port || '5432',
        database: parsed.pathname.replace('/', ''),
        username: parsed.username,
        queryParams: parsed.search || 'none',
        passwordSet: !!parsed.password,
        fullPreview: `${parsed.protocol}//${parsed.username}:***@${parsed.hostname}:${parsed.port || '5432'}${parsed.pathname}${parsed.search}`
      }
    } catch (e) {
      return { error: 'Invalid URL format', raw: url.substring(0, 30) + '...' }
    }
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

  // Parse DATABASE_URL for detailed connection info
  const databaseConnectionInfo = parseConnectionString(process.env.DATABASE_URL)

  // Debug: Show raw DATABASE_URL host extraction
  const amplifyDbUrl = process.env.AMPLIFY_DATABASE_URL || ''
  const rawDbUrl = process.env.DATABASE_URL || ''
  const effectiveDbUrl = amplifyDbUrl || rawDbUrl
  const hostMatch = effectiveDbUrl.match(/@([^:\/]+)/)
  const userMatch = effectiveDbUrl.match(/\/\/([^:@]+)/)

  return NextResponse.json({
    debug: {
      extractedHost: hostMatch ? hostMatch[1] : 'not found',
      extractedUser: userMatch ? userMatch[1] : 'not found',
      urlLength: effectiveDbUrl.length,
      startsWithPostgresql: effectiveDbUrl.startsWith('postgresql://'),
      containsPooler: effectiveDbUrl.includes('pooler.supabase.com'),
      containsDbDirect: effectiveDbUrl.includes('db.') && effectiveDbUrl.includes('.supabase.co'),
      amplifyDbUrlSet: !!amplifyDbUrl,
      amplifyDbUrlLength: amplifyDbUrl.length,
      usingAmplifyUrl: !!amplifyDbUrl,
    },
    stats,
    requiredVariables: requiredVars,
    databaseConnectionInfo,
    allEnvironmentVariables: allEnvPreview,
    timestamp: new Date().toISOString()
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }
  })
}
