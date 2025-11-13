import { auth } from "@/auth"
import { Role } from "@prisma/client"
import { NextRequest } from "next/server"

/**
 * Get the current user session
 * Returns null if not authenticated
 */
export async function getSession() {
  return await auth()
}

/**
 * Get the current authenticated user
 * Throws error if not authenticated
 */
export async function getCurrentUser() {
  const session = await auth()

  if (!session || !session.user) {
    throw new Error("Unauthorized: No active session")
  }

  return session.user
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin() {
  const session = await auth()
  return session?.user?.role === Role.ADMIN
}

/**
 * Require admin role, throws error if not admin
 */
export async function requireAdmin() {
  const session = await auth()

  if (!session || !session.user) {
    throw new Error("Unauthorized: No active session")
  }

  if (session.user.role !== Role.ADMIN) {
    throw new Error("Forbidden: Admin access required")
  }

  return session.user
}

/**
 * Check if the current user can access a resource
 * Admins can access all resources
 * Regular users can only access their own resources
 */
export async function canAccessResource(resourceUserId: number): Promise<boolean> {
  const session = await auth()

  if (!session || !session.user) {
    return false
  }

  // Admins can access everything
  if (session.user.role === Role.ADMIN) {
    return true
  }

  // Regular users can only access their own resources
  return parseInt(session.user.id) === resourceUserId
}

/**
 * Require access to a resource
 * Throws error if user cannot access the resource
 */
export async function requireResourceAccess(resourceUserId: number) {
  const session = await auth()

  if (!session || !session.user) {
    throw new Error("Unauthorized: No active session")
  }

  const hasAccess = await canAccessResource(resourceUserId)

  if (!hasAccess) {
    throw new Error("Forbidden: You don't have access to this resource")
  }

  return session.user
}

/**
 * Create a JSON response for auth errors
 */
export function createAuthErrorResponse(error: Error, status: number = 401) {
  return Response.json(
    { error: error.message },
    { status }
  )
}

/**
 * Middleware helper to get session from request
 */
export async function getSessionFromRequest(request: NextRequest) {
  return await auth()
}
