'use client'

import { useSearchParams } from 'next/navigation'
import { Container, Card, Button, Alert } from 'react-bootstrap'
import Link from 'next/link'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.'
      case 'AccessDenied':
        return 'You do not have permission to sign in.'
      case 'Verification':
        return 'The verification token has expired or has already been used.'
      case 'OAuthSignin':
      case 'OAuthCallback':
      case 'OAuthCreateAccount':
      case 'EmailCreateAccount':
      case 'Callback':
        return 'There was an error during the sign-in process.'
      case 'OAuthAccountNotLinked':
        return 'This email is already associated with another account.'
      case 'EmailSignin':
        return 'The email could not be sent.'
      case 'CredentialsSignin':
        return 'Sign in failed. Check the details you provided are correct.'
      case 'SessionRequired':
        return 'Please sign in to access this page.'
      default:
        return 'An unexpected error occurred during authentication.'
    }
  }

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <Card style={{ maxWidth: '500px', width: '100%' }}>
        <Card.Body className="p-5">
          <h1 className="h3 mb-4">Authentication Error</h1>
          <Alert variant="danger">
            {getErrorMessage(error)}
          </Alert>
          <div className="d-grid gap-2">
            <Link href="/auth/signin" passHref>
              <Button variant="primary" size="lg">
                Try Again
              </Button>
            </Link>
            <Link href="/" passHref>
              <Button variant="outline-secondary">
                Go Home
              </Button>
            </Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  )
}
