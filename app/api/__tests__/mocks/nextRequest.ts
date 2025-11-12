import { NextRequest } from 'next/server'

export const createMockRequest = (
  method: string,
  body?: any,
  params?: Record<string, string>
): NextRequest => {
  const url = 'http://localhost:3000/api/users'
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  }

  if (body) {
    init.body = JSON.stringify(body)
  }

  const request = new NextRequest(url, init)

  // Add params if provided (for dynamic routes)
  if (params) {
    Object.defineProperty(request, 'params', {
      value: params,
      writable: true,
    })
  }

  return request
}
