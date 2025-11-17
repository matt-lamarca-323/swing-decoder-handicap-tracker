import { NextResponse } from 'next/server'

export async function GET() {
  // Check which environment variables are set (without exposing values)
  const envCheck = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    AUTH_URL: !!process.env.AUTH_URL,
    AUTH_GOOGLE_ID: !!process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: !!process.env.AUTH_GOOGLE_SECRET,
    GOLF_COURSE_API_KEY: !!process.env.GOLF_COURSE_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
  }

  // Show first few characters of DATABASE_URL if it exists (for debugging)
  const dbUrlPreview = process.env.DATABASE_URL
    ? `${process.env.DATABASE_URL.substring(0, 20)}...`
    : 'NOT SET'

  return NextResponse.json({
    environmentVariables: envCheck,
    databaseUrlPreview: dbUrlPreview,
    timestamp: new Date().toISOString()
  })
}
