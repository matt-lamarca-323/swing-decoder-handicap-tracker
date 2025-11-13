'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Container, Spinner } from 'react-bootstrap'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (session) {
      // Redirect authenticated users to dashboard
      router.push('/dashboard')
    } else {
      // Redirect unauthenticated users to sign-in
      router.push('/auth/signin')
    }
  }, [session, status, router])

  // Show loading spinner while redirecting
  return (
    <Container className="py-5 text-center">
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </Container>
  )
}
